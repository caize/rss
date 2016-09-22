import mongoose from 'mongoose';
var Schema = mongoose.Schema;

// 用户订阅表

const UserFeedSchema = new Schema({ 
    feed_id:        [{type: Schema.Types.ObjectId, ref: 'Feed'}],   // 订阅源 ID
    user_id:        [{type: Schema.Types.ObjectId, ref: 'User'}],   // 用户 ID

    own_title:      {type: String},
    feed_time:      {type: Date, default: Date.now()},
    recent_update:  {type: Date},
    mark:           {type: Number},
    read:           {type: Number, default: 0},
    unread:         {type: Number, default: 0}
});

var UserFeed = mongoose.model('UserFeed', UserFeedSchema);

module.exports = UserFeed;
