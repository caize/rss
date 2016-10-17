import send from 'koa-send';

/**
 * 配合 Angular 的 html5mode
 */
module.exports = function() {
    return async (ctx, next) => {
        if(/^\/(feed|feeds|post|posts|me|search)/.test(ctx.request.url)) {
            await send(ctx, './public/index.html');        
        }
        await next();
    }
}
