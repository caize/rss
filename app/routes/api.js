import Router from 'koa-router';
import feedRoute from './feedRoute';
import postRoute from './postRoute';
import userRoute from './userRoute';

var api = new Router({
    prefix: '/api'
});

api.use('/feed', feedRoute.routes(), feedRoute.allowedMethods());
api.use('/feed/:feed_id/post', postRoute.routes(), postRoute.allowedMethods());

export default api;