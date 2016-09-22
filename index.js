import Koa from 'koa';
import path from 'path';
import router from './app/routes/index';
import api from './app/routes/api';
import mongoose from 'mongoose';
import config from './config/config';
import convert from 'koa-convert';
import Bodyparser from 'koa-bodyparser';
import Koaerror from 'koa-onerror';
import logger from 'koa-logger';
import serve from 'koa-static';
import jwt from 'koa-jwt';

var app = new Koa();
var bodyparser = new Bodyparser();

mongoose.Promise = require('bluebird');
global.Promise = require('bluebird');

mongoose.connect(`mongodb://${config.MongoDB.HOST}:${config.MongoDB.PORT}/${config.MongoDB.NAME}`);

app.use(convert(serve(path.resolve(__dirname, 'public'))))
app.use(convert(bodyparser));
app.use(convert(logger()))

// 全局错误处理
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;            
        ctx.body = { success: false, message: err.toString()};
    }
});

// 主页和登录注册接口
app.use(router.routes())
   .use(router.allowedMethods());

/****** JWT 处理 TODO ...
app.use(jwt({ secret: config.app.publicKey, algorithm: 'RS256' }));

app.use((ctx, next) => {
  if (this.url.match(/^\/api/)) {
      ctx.body = ctx;
  }
});
*/
// API
app.use(api.routes())
   .use(api.allowedMethods())

app.listen(3000);
