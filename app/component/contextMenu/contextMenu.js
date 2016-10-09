(function() {
    angular
        .module('app')
        .directive('contextMenu', contextMenu);
    
    function contextMenu() {
        return {
            restrict: 'EA',
            scope: true,
            replace: true,
            templateUrl: 'contextMenu/contextMenu.html',
            controllerAs: 'vm',
            controller: function contextMenuController($scope, Feed, _, User) {
                let vm = this;
                vm.time = Date.now();
                vm.feeds = [];

                Feed.get(res => vm.feeds = _.groupBy(res.data, 'folder'));
                User.get(res => vm.user = res.data);

                setInterval(() => {
                    vm.time = Date.now();
                    $scope.$digest();
                }, 1000);
                         
                $scope.$on('ADD_FEED', (event, data) => {
                    if(vm.feeds.default) {
                        vm.feeds.default.push(data);
                    } else {
                        vm.feeds['default'] = [data];
                    }
                });
                $scope.$on('DELETE_FEED', (event, data) => {
                    _.mapObject(vm.feeds, feeds => _.filter(feeds, feed => feed.feed_id !== data))}); 
                $scope.$on('READ_POST', (event, data) => {
                    _.mapObject(vm.feeds, feeds => _.each(feeds, feed =>
                        feed.feed_id === data ? feed.unread -- : ''));
                });
            }
        }
    }
}());
