require("babel-core/register")({
    presets: ['stage-3', 'es2015']
})

require("babel-polyfill")

require("./update.js")

// 更新订阅源文章