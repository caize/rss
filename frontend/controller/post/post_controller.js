(function() {
    angular
        .module('app')
        .controller('PostController', PostController);

    function PostController(post, storage, $scope, _) {
        var vm = this;
        vm.currentPost = post.data.result;
        vm.currentPostDetail = post.data.detail;

        storage.title = vm.currentPost.title;
        storage.begintime = Date.now();
        storage.status = '';
    }
    
}());
