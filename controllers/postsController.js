import PostModel from '../models/post'
import UserPostModel from '../models/userPost'
import UserFeedModel from '../models/userFeed'
import _ from 'underscore'

/**
 * 这里主要是用户全部文章操作的接口
 */


/**
 * 获取全部 ** 文章
 * @method: get
 * @link:   /api/posts
 * @param:  type [mark|unread]
 * @param:  feed_id
 */
exports.list = async(ctx, next) => {
    let user_id = ctx.state.user.id,
        type = ctx.request.query.type,
        feed_id = ctx.request.query.feed_id,
        result, detail
    if (['mark', 'unread'].includes(type)) {
        let posts = [],
            feeds = await UserFeedModel.find({
                user_id: user_id
            }, {
                feed_id: 1
            })
        await Promise.all(feeds.map(feed => new Promise(async(resolve) => {
            let query = {
                feed_id: feed.feed_id[0],
                user_id: user_id
            }
            if (type === 'mark') query['mark'] = true
            else query['read'] = true
            let result = await UserPostModel.find(query, {
                _id: 0,
                post_id: 1,
                mark_date: 1
            })
            let data = _.invoke(_.flatten(_.pluck(result, 'post_id'), true), 'toString'),
                items
            await PostModel.find({
                feed_id: feed.feed_id
            }, {
                summary: 0,
                description: 0
            }).populate('feed_id', {
                _id: 1,
                title: 1,
                favicon: 1
            }).lean().exec((err, data) => {
                return items = _.map(data, item => {
                    item.feed_title = item.feed_id[0].title
                    item.favicon = item.feed_id[0].favicon
                    item.feed_id = item.feed_id[0]._id
                    return item
                })
            })
            if (type === 'mark') {
                _.each(items, item => _.contains(data, item._id.toString()) ? posts.push(item) : _.noop())
            } else {
                _.each(items, item => !_.contains(data, item._id.toString()) ? posts.push(item) : _.noop())
            }
            resolve()
        })))
        ctx.body = {
            success: true,
            data: posts
        }
    } else if (feed_id !== undefined) {
        await Promise.all([
            Promise.resolve().then(async() => result = await PostModel.find({
                feed_id: feed_id
            }, {
                description: 0,
                summary: 0
            })),
            Promise.resolve().then(async() => detail = await UserPostModel.find({
                feed_id: feed_id,
                user_id: user_id
            }, {
                user_id: 0,
                feed_id: 0
            }))
        ])
        ctx.body = {
            success: true,
            data: {
                posts: result,
                detail: detail
            }
        }
    } else {
        ctx.throw(404, '不支持的查询')
    }
}

/**
 * 最近更新的未读的文章
 * @method: get
 * @link:   /api/posts/recent
 */
exports.main = async(ctx, next) => {
    let user_id = ctx.state.user.id, items
    await UserFeedModel.find({
        user_id: user_id
    }, {
        user_id: 0
    })
    .populate('feed_id', {
        favicon: 1,
        title: 1
    }).lean().exec((err, data) => {
        return items = _.map(data, item => {
            item.feed_title = item.feed_id[0].title
            item.favicon = item.feed_id[0].favicon
            item.feed_id = item.feed_id[0]._id
            return item
        })
    })
    await Promise.all(_.map(items, item => new Promise(async(resolve) => {
        let userposts = await UserPostModel.find({
            feed_id: item.feed_id,
            user_id: user_id,
            read: true
        })
        await PostModel.find({
            feed_id: item.feed_id
        }).sort('pubdate').lean().exec((err, posts) => {
            let count = posts.length - userposts.length,
                read_ids = _.invoke(_.pluck(userposts, 'post_id'), 'toString')
            for (let post of posts.reverse()) {
                if (!read_ids.includes(post._id.toString())) {
                    post.summary = post.description.replace(/<[^>]+>/g, '').slice(0, 550)
                    post.description = post.description.match(/<img\s+src="(.*?)"/)
                    if (post.description) {
                        if (post.description[1].slice(0, 2) !== '//' && post.description[1].slice(0, 2) !== 'ht') {
                            post.description = post.website + post.description[1]
                        } else {
                            post.description = post.description[1]
                        }
                    } else {
                        post.description = '/img/noimg.png'
                    }
                    resolve(Object.assign(post, item, {
                        _id: post._id,
                        unread: count
                    }))
                    break
                }
            }
            resolve([])
        })
    }))).then(items => {
        ctx.body = {
            success: true,
            data: _.filter(items, item => item.length !== 0)
        }
    }).catch(e => e)
}

/**
 * 更新全部未读文章
 * @method: put
 * @link:   /api/posts
 * @param:  {string} feed_id
 */
exports.update = async(ctx, next) => {
    if(ctx.request.body.feed_id === undefined || ctx.request.body.feed_id === null) {
        ctx.throw(404, '出错了')
    }
    // 电脑版有全部未读文章标记已读的接口，所以需要进行 split
    let ids = ctx.request.body.feed_id.split(','),
        user_id = ctx.state.user.id
    _.each(ids, async(id) => {
        let posts = await PostModel.find({
            feed_id: id
        }).sort('date')
        posts = _.pluck(posts, '_id')
        _.each(posts, async(post) => {
            let state = await UserPostModel.findOne({
                user_id: user_id,
                post_id: post
            })
            if (state && state._id) {
                if (state.read) return
                else {
                    state.read = true
                    state.save()
                }
            } else {
                state = new UserPostModel({
                    user_id: user_id,
                    feed_id: id,
                    post_id: post,
                    read: true,
                    read_date: Date.now()
                })
                state.save()
            }
        })
    })
    ctx.body = {
        success: true,
        data: '操作成功'
    }
}