import FeedModel from '../models/feed';
import PostModel from '../models/post';
import UserFeedModel from '../models/userFeed'

import FeedParser from 'feedparser';
import request from 'request';

/**
 * 创建/新增订阅源
 * @method: post
 * @url:    /api/feed
 * @params: {string} feedlink
 */
exports.create = async (ctx, next) => {
    var feedlink = ctx.request.body.feedlink.trim();
    var userid = ctx.state.user.id;

    var feedparser = new FeedParser(), feed = new FeedModel(), _id;

    // 查找数据库是否有该订阅源
    var result = await FeedModel.findOne({absurl: feedlink});
    // 判断数据库已存在该订阅源
    if(result && result._id) {
        var userresult = await UserFeedModel.findOne({absUrl: feedlink});
        // 判断用户是否已经订阅该订阅源
        if(userresult && userresult._id) {
            return ctx.body = { success: false, data: "已订阅源 " + result.title };
        } else {
            // 订阅源的订阅人数 +1
            result.feeder += 1;
            result.save();
            var userfeed = UserFeedModel({feed_id: result._id, user_id: userid});
            // 添加到用户订阅表
            userfeed.save();
            return ctx.body = { success: true, data: {id: result._id} };
        }
    } else {
        await new Promise((resolve, reject) => {
            var req = request(feedlink, err => {
                reject(err);
            });
            req.on('response', res => {
                if(res.statusCode != 200) {
                    reject(res.statusCode);
                } else {
                    res.pipe(feedparser);
                    feedparser.on('error', err => {
                        if(err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                }
            });

            feedparser.on('meta', async function() {
                var feed = new FeedModel(Object.assign(this.meta, {absurl: feedlink}));
                var store = await feed.save();
                var _id = store._id;
                feedparser.on('readable', function() {
                    while(result = this.read()) {
                        var post = new PostModel(Object.assign(result, {feed_id: _id}));
                        post.save();
                    }
                    ctx.body = { success: true, data: {id: _id} };
                    resolve();
                });
            });
        });
    }

    
}

/**
 * 获取订阅源信息
 * @method: get
 * @url:    /api/feed/{id}
 * @params: {string} id
 */
exports.list = async (ctx, next) => {
    var id = ctx.params.id;
    var result = await FeedModel.findById(id).catch(e => e);
    if (result._id) {
        ctx.body = { success: true, data: result };
    } else {
        ctx.throw(result);
    }
}

/**
 * 获取全部订阅源
 * @method: get
 * @url:    /api/feed
 * TODO:    根据用户获取
 */
exports.listAll = async (ctx, next) => {
    // TODO ctx.state.user is the user info
    console.log(ctx.state.user);
    var result = await FeedModel.find();
    ctx.body = { success: true, data: result };
}
