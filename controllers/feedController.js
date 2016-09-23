import FeedModel from '../models/feed';
import PostModel from '../models/post';
import UserFeedModel from '../models/userFeed'
import FeedParser from 'feedparser';
import request from 'request';

/**
 * 创建/订阅 订阅源
 * @method: post
 * @url:    /api/feed
 * @params: {string} feedlink
 */
exports.create = async (ctx, next) => {
    var feedlink = ctx.request.body.feedlink && ctx.request.body.feedlink.trim();
    var userid = ctx.state.user.id;
    var feedparser = new FeedParser(), feed = new FeedModel(), _id;

    // 查找数据库是否有该订阅源
    var result = await FeedModel.findOne({absurl: feedlink});
    // 判断数据库已存在该订阅源
    if(result && result._id) {
        var userresult = await UserFeedModel.findOne({feed_id: result._id});
        // 判断用户是否已经订阅该订阅源
        if(userresult && userresult._id) {
            return ctx.body = { success: false, data: `已订阅源 ${result.title}(${result.id})` };
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
                var feedid = store._id;
                var userfeed = new UserFeedModel({feed_id: feedid, user_id: userid});
                userfeed.save().catch(e => e);
                feedparser.on('readable', function() {
                    while(result = this.read()) {
                        var post = new PostModel(Object.assign(result, {feed_id: feedid}));
                        post.save().catch(e => e);
                    }
                    ctx.body = { success: true, data: {id: feedid} };
                    resolve();
                });
            });
        });
    }
}

/**
 * 获取 订阅源信息
 * @method: get
 * @url:    /api/feed/{id}
 * @params: {string} id
 */
exports.list = async (ctx, next) => {
    var id = ctx.params.id;
    var userid = ctx.state.user.id;
    var result = await UserFeedModel.findOne({user_id: userid, feed_id: id}, {user_id: 0}).populate('feed_id').exec().catch(e => e);
    if (result && result._id) {
        ctx.body = { success: true, data: result };
    } else {
        ctx.throw(result);
    }
}

/**
 * 获取 全部订阅源
 * @method: get
 * @url:    /api/feed
 */
exports.listAll = async (ctx, next) => {
    var userid = ctx.state.user.id;
    var result = await UserFeedModel.find({user_id: userid}, {user_id: 0}).populate('feed_id', {title: 1}).exec().catch(e => e);
    ctx.body = { success: true, data: result };
}

/**
 * 取消/删除 订阅源
 * @method: delete
 * @url:    /api/feed
 * @params: {string} id
 */
exports.remove = async (ctx, next) => {
    var userid = ctx.state.user.id;
    var feed_id = ctx.params.id;
    var result = await UserFeedModel.find({feed_id: feed_id}).remove();
    if(result.result.n === 0) {
        return ctx.body = { success: false, data: '你没有订阅该订阅源' };
    } else {
        FeedModel.update({_id: feed_id}, {$inc: {feeder: -1}});
        return ctx.body = { success: true, data: `成功删除` };
    }
}
