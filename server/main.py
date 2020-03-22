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
from bson.objectid import ObjectId
from contextvars import ContextVar
from aiojobs.aiohttp import setup, spawn
from pymongo.results import DeleteResult, InsertOneResult

DATA_DIR = ContextVar('DATA_DIR')
ORIGIN = 'http://localhost:8081'
base_url = f'{ORIGIN}/u'

routes = web.RouteTableDef()

@routes.get('/test')
async def test_request(request: web.Request):
    return web.Response(text=dumps({'hello': 'world'}))


@routes.get('/u/')
async def get_urls(request: web.Request):
    urls = await request.app['db'].url_shortener.urls.find({}, {'_id': False}).to_list(None)
    return web.Response(text=dumps(urls))


@routes.post('/u/')
async def create_shortener(request: web.Request):
    data = await request.json()
    col = request.app['db'].url_shortener.urls
    if data and (url := data.get('url')):
        doc = await col.find_one({'url': url});
        if doc:
            id = doc['id']
        else:
            _id = ObjectId()
            id = base64.urlsafe_b64encode(_id.binary).decode()
            #id = base64.urlsafe_b64encode(_id.binary[:4]).decode()
            await spawn(request, create_qr(id))
            await col.insert_one({'url': url, '_id': _id, 'id': id})
        return web.Response(text=dumps({'id': id}))
    return web.HTTPBadRequest()


@routes.get('/u/{id}.svg')
async def get_shortener_svg(request: web.Request):
    id = request.match_info['id']
    data_dir = DATA_DIR.get()
    return web.FileResponse(data_dir / f'{id}.svg')


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


@routes.delete('/u/{id}')
async def create_shortener(request: web.Request):
    id = request.match_info['id']
    if id is None:
        return web.HTTPBadRequest()
    res: DeleteResult = await request.app['db'].url_shortener.urls.delete_one({'id': id});
    if res.deleted_count == 1:
        return web.HTTPOk()
    return web.HTTPNotFound()


async def create_qr(id: str):
    factory = qrcode.image.svg.SvgPathImage
    url = f'{base_url}/{id}'
    img:qrcode.image.svg.SvgPathImage = qrcode.make(url, image_factory=factory)
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


async def main():
    app = web.Application()
    host = os.environ.get('MONGO_HOST', 'localhost')
    port = os.environ.get('MONGO_PORT', 27017)
    mongodb_url = f'mongodb://{host}:{port}'
    logging.info(f'using {mongodb_url=}')
    data_dir = Path(os.environ.get('DATA_DIR', Path(__file__).resolve().parent / 'data'))
    DATA_DIR.set(data_dir)
    data_dir.mkdir(parents=True, exist_ok=True)
    app['db'] = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
    await refresh_svgs(app['db'])
    col = app['db'].url_shortener.get_collection('urls')
    await col.create_index('url', unique=True)
    await col.create_index('id', unique=True)
    app.on_cleanup.append(on_cleanup)
    app.add_routes(routes)
    setup(app)
    return app


if __name__ == '__main__':
    web.run_app(main(), host='0.0.0.0', port=8081)
