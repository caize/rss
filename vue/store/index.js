import Vue from 'vue';
import Vuex from 'vuex';
import * as actions from './actions';
import * as getters from './getters';
import feed from './modules/feed';
import feeds from './modules/feeds';
import post from './modules/post';
import posts from './modules/posts';
import user from './modules/user';
import createLogger from 'vuex/dist/logger';

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
    actions,
    getters,
    modules: {
        feed,
        feeds,
        post,
        posts,
        user
    },
    strict: debug,
    plugins: debug ? [createLogger()] : []
})