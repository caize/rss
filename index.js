import Koa from 'koa'
import api from './routes/index'
import handel from './routes/handel'
import config from './config/config'
import mongoose from 'mongoose'
import jwt from 'koa-jwt'
import http from 'http'
import http2 from 'http2'
import enforceHttps from 'koa-sslify'
import enforceWww from './middlewares/enforce-www'
import onerror from './middlewares/onerror'
import xsrf from './middlewares/xsrf'
import cookies from './middlewares/cookies'
import nghtml5 from './middlewares/nghtml5'
import cache from './middlewares/cache'
import ua from './middlewares/ua'
import normal from './middlewares/normal'

mongoose.Promise = require('bluebird')
global.Promise = require('bluebird')

var app = new Koa()

if (config.ENV === 'production') {
    mongoose.connect(`mongodb://${config.MONGODB.USER}:${config.MONGODB.PASSWORD}@${config.MONGODB.HOST}:${config.MONGODB.PORT}/${config.MONGODB.NAME}`)
    app.use(enforceHttps())
    app.use(enforceWww())
} else {
    mongoose.connect(`mongodb://${config.MONGODB.HOST}:${config.MONGODB.PORT}/${config.MONGODB.NAME}`)
}


app.use(ua())
app.use(cookies())
app.use(normal())
app.use(xsrf())
app.use(onerror())
app.use(cache())

app.use(handel.routes())
    .use(handel.allowedMethods())

// Below needs JWT verfiy
app.use(jwt({
    secret:    config.APP.JWT_KEY,
    algorithm: 'RS256'
}).unless({
    path: [/^\/static|css|js|img|fonts|favicon/]
}))

// API (Protected)
app.use(api.routes())
    .use(api.allowedMethods())
app.use(nghtml5())
http.createServer(app.callback()).listen(config.PORT)

// Production Only
if (config.ENV === 'production') {
    const options = {
        key:  config.APP.SSL_KEY,
        cert: config.APP.SSL_CERT,
        ca:   config.APP.CA
    }
    http2.createServer(options, app.callback()).listen(443)
}
