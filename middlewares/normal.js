import compose from 'koa-compose';
import compress from 'koa-compress';
import json from 'koa-json';
import convert from 'koa-convert';
import bodyparser from 'koa-bodyparser';
import logger from 'koa-logger';
import serve from 'koa-static';
import views from 'koa-views';
import path from 'path';
import favicon from 'koa-favicon';

const normal = () => compose([
    compress({
        filter: content_type => /text|application/i.test(content_type),
        threshold: 2048,
        flush: require('zlib').Z_SYNC_FLUSH
    }),
    json(),
    convert(bodyparser()),
    convert(logger()),
    convert(serve(path.resolve(__dirname, '../public'), {
        defer: true
    })),
    views(path.resolve(__dirname, '../views'), {
        extension: 'ejs'
    }),
    favicon(path.resolve(__dirname, '../public/img/rss.png'))
]);

export default normal;