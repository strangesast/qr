import os
import qrcode
import base64
import pymongo
import logging
from pathlib import Path
import qrcode.image.svg
from aiohttp import web
import motor.motor_asyncio
from bson.json_util import dumps
from pymongo import ReturnDocument
from bson.objectid import ObjectId
from contextvars import ContextVar
from aiojobs.aiohttp import setup, spawn
from pymongo.results import DeleteResult, InsertOneResult, UpdateResult

DATA_DIR = ContextVar('DATA_DIR')
BASE_URL = ContextVar('BASE_URL')
routes = web.RouteTableDef()

@routes.get('/test')
async def test_request(request: web.Request):
    return web.Response(text=dumps({'hello': 'world'}))


@routes.get('/u/')
async def get_urls(request: web.Request):
    col = request.app['db'].url_shortener.urls_view
    urls = await col.find({}, {'_id': False}).to_list(None)
    return web.Response(text=dumps(urls))


@routes.post('/u/')
async def create_shortener(request: web.Request):
    data = await request.json()
    col = request.app['db'].url_shortener.urls
    if data and (url := data.get('url')):
        doc = await col.find_one({'url': url});
        if doc:
            id = doc['id']
            exists = True
        else:
            _id = ObjectId()
            b = _id.binary
            #b = b[:4]
            id = base64.urlsafe_b64encode(b).decode()
            await spawn(request, create_qr(id))
            title = data.get('title', None)
            await col.insert_one({'url': url, '_id': _id, 'id': id, 'title': title})
            exists = False
        return web.Response(text=dumps({'id': id, 'exists': exists}))
    return web.HTTPBadRequest()


@routes.put('/u/')
async def update_shortener(request: web.Request):
    data = await request.json()
    col = request.app['db'].url_shortener.urls
    if not data:
        return web.HTTPBadRequest()

    try:
        id = data.get('id')
        assert id is not None
        _id = base64.urlsafe_b64decode(id).hex()
        assert ObjectId.is_valid(_id)
        _id = ObjectId(_id)
    except:
        return web.HTTPBadRequest()

    q = {'_id': _id, 'id': base64.urlsafe_b64encode(_id.binary).decode()}
    arg = {'$set': {k: data[k] for k in ['url', 'title', 'count'] if k in data}}

    res = await col.update_one(q, arg, upsert=True)
    if res.upserted_id:
        await spawn(request, create_qr(id))
    
    return web.Response(text=dumps({'id': id}))


@routes.get('/u/{id}.svg')
async def get_shortener_svg(request: web.Request):
    id = request.match_info['id']
    data_dir = DATA_DIR.get()
    try:
        return web.FileResponse(data_dir / f'{id}.svg')
    except:
        return web.HTTPNotFound()


@routes.get('/u/{id}.json')
async def get_shortener_json(request: web.Request):
    id = request.match_info['id']
    doc = await request.app['db'].url_shortener.urls_view.find_one({'id': id}, {'_id': 0});
    if doc:
        return web.Response(text=dumps(doc));
    else:
        return web.HTTPNotFound()


@routes.get('/u/{id}')
async def get_shortener(request: web.Request):
    id = request.match_info['id']
    if id is None:
        return web.HTTPBadRequest()
    doc = await request.app['db'].url_shortener.urls.find_one_and_update({'id': id}, {'$inc': {'count': 1}});
    if doc is None:
        return web.HTTPNotFound()
    url = doc['url']
    return web.HTTPTemporaryRedirect(url)


@routes.view('/u/{id}/d')
@routes.delete('/u/{id}')
async def remove_shortener(request: web.Request):
    id = request.match_info['id']
    if id is None:
        return web.HTTPBadRequest()
    col = request.app['db'].url_shortener.urls
    res: DeleteResult = await col.delete_one({'id': id});
    if res.deleted_count == 1:
        return web.HTTPOk()
    return web.HTTPNotFound()


async def create_qr(id: str):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=0,
        image_factory=qrcode.image.svg.SvgPathImage,
    )
    base_url = BASE_URL.get()
    qr.add_data(base_url + id)
    qr.make(fit=True)
    img = qr.make_image()
    data_dir = DATA_DIR.get()
    img.save(data_dir / f'{id}.svg')


async def refresh_svgs(db: motor.motor_asyncio.AsyncIOMotorClient, reset = True):
    data_dir = DATA_DIR.get()
    if reset:
        for file in data_dir.glob('*.svg'):
            file.unlink()
    async for doc in db.url_shortener.urls.find():
        await create_qr(doc['id'])


def on_cleanup(app):
    app['db'].close()


async def initialize_db(db: motor.motor_asyncio.AsyncIOMotorClient):
    await db.url_shortener.get_collection('urls_view').drop()
    base_url = BASE_URL.get()
    await db.url_shortener.command({
        'create': 'urls_view',
        'viewOn': 'urls',
        'pipeline': [
            {'$addFields': {'count': {'$ifNull': ['$count', 0]}, 'link': {'$concat': [base_url, '$id']}}},
            {'$project': {'_id': 0}},
            {'$sort': {'count': -1}},
        ]
    });



async def main():
    app = web.Application()
    host = os.environ.get('MONGO_HOST', 'localhost')
    port = os.environ.get('MONGO_PORT', 27017)
    mongodb_url = f'mongodb://{host}:{port}'
    logging.info(f'using {mongodb_url=}')
    data_dir = Path(os.environ.get('DATA_DIR', Path(__file__).resolve().parent / 'data'))
    origin = os.environ.get('ORIGIN', 'http://localhost:8081')
    BASE_URL.set(f'{origin}/u/')
    DATA_DIR.set(data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    app['db'] = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
    await refresh_svgs(app['db'])
    await initialize_db(app['db'])
    col = app['db'].url_shortener.get_collection('urls')
    await col.create_index('url', unique=True)
    await col.create_index('id', unique=True)
    app.on_cleanup.append(on_cleanup)
    app.add_routes(routes)
    setup(app)
    return app


if __name__ == '__main__':
    web.run_app(main(), host='0.0.0.0', port=8081)
