(function() {
    angular
        .module('app')
        .controller('PostsController', PostsController);

    function PostsController($stateParams, posts, $state, Post, Posts, $rootScope) {
        var vm = this;
        vm.posts = posts.data;
        vm.readall = readall;
        vm.type = $stateParams.type === 'unread' ? "未读" : "星标";
        vm.count = vm.posts.length;

        // Function
        vm.goto = goto;

        function goto(post) {
            for(let post of vm.posts) {
                post.active = false;
            }
            post.active = true;
            if(post.read) {
                return;
            } else {
                vm.count --;
                post.read = true;
                $rootScope.$broadcast('READ_POST', post.feed_id);
                Post.update({feed_id: post.feed_id, id: post._id}, {type: 'read'});
            }
            $state.current.data = post.feed_id;
            $state.go('posts.post', {id: post._id});
        }
        function readall() {
            var str = '';
            for(let post of vm.posts) {
                if(!post.read) $rootScope.$broadcast('READ_POST', post.feed_id);
                post.read = true;                
                str += str === '' ? post._id : ',' + post._id;
            }
            Posts.save({id: str});
        }
    }
}());
