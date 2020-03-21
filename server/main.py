import os
import base64
import pymongo
import logging
from aiohttp import web
import motor.motor_asyncio
from bson.json_util import dumps
from bson.objectid import ObjectId
from pymongo.results import DeleteResult, InsertOneResult


routes = web.RouteTableDef()

@routes.get('/test')
async def test_request(request: web.Request):
    return web.Response(text=dumps({'hello': 'world'}))


@routes.get('/u/')
async def get_urls(request: web.Request):
    urls = await request.app['db'].url_shortener.urls.find({}).to_list(None)
    urls = [{'id': base64.urlsafe_b64encode(doc['_id'].binary).decode(), 'url': doc['url']} for doc in urls]
    return web.Response(text=dumps(urls))


@routes.post('/u/')
async def create_shortener(request: web.Request):
    data = await request.json()
    col = request.app['db'].url_shortener.urls
    if data and (url := data.get('url')):
        doc = await col.find_one({'url': url});
        if doc:
            id = doc['_id']
        else:
            res: InsertOneResult = await col.insert_one({'url': url})
            id = res.inserted_id
        id = base64.urlsafe_b64encode(id.binary).decode()
        return web.Response(text=dumps({'id': id}))
    return web.HTTPBadRequest()


@routes.get('/u/{id}')
async def get_shortener(request: web.Request):
    id = get_id(request)
    if id is None:
        return web.HTTPBadRequest()
    doc = await request.app['db'].url_shortener.urls.find_one({'_id': id});
    if doc is None:
        return web.HTTPNotFound()
    url = doc['url']
    return web.HTTPTemporaryRedirect(url)


@routes.delete('/u/{id}')
async def create_shortener(request: web.Request):
    id = get_id(request)
    if id is None:
        return web.HTTPBadRequest()
    res: DeleteResult = await request.app['db'].url_shortener.urls.delete_one({'_id': id});
    if res.deleted_count == 1:
        return web.HTTPOk()
    return web.HTTPNotFound()


def get_id(request: web.Request) -> ObjectId:
   try:
       id = request.match_info['id']
       id = base64.urlsafe_b64decode(id)
       id = ObjectId(id)
       return id
   except:
       return None


def on_cleanup(app):
    app['db'].close()


async def main():
    app = web.Application()
    host = os.environ.get('MONGO_HOST', 'localhost')
    port = os.environ.get('MONGO_PORT', 27017)
    mongodb_url = f'mongodb://{host}:{port}'
    logging.info(f'using {mongodb_url=}')
    app['db'] = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
    app['db'].url_shortener.get_collection('urls').create_index('url', [('url', pymongo.DESCENDING)], unique=True)
    app.on_cleanup.append(on_cleanup)
    app.add_routes(routes)
    return app


if __name__ == '__main__':
    web.run_app(main(), host='0.0.0.0', port=8081)
