angular.module('breezio.content', ['breezio.content.posts', 'breezio.content.users', 'breezio.content.notes'])

.run(function($rootScope) {
  $rootScope.posts = {};
})

.controller('ContentCtrl', function($scope, $state, Posts) {
  $scope.loading = true;
  $scope.start = 0;
  $scope.exhausted = false;
  $scope.posts = [];

  $scope.refreshPosts = function() {
    $scope.start = 0;
    $scope.posts = [];
    $scope.loading = true;
    Posts.get().then(function(res) {
      $scope.loading = false;
      $scope.posts = res.data.items;
      $scope.exhausted = false;
    });
  };

  $scope.loadMore = function() {
    if (!$scope.loading) {
      $scope.start += 20;
      Posts.get({start: $scope.start}).then(function(res) {
        console.log($scope.posts);
        $scope.posts = $scope.posts.concat(res.data.items);

        if (res.data.items.length < 1) {
          $scope.exhausted = true;
        }
      }).finally(function() {
        $scope.$broadcast('scroll.infiniteScrollComplete');
      });
    } else {
      $scope.$broadcast('scroll.infiniteScrollComplete');
    }
  };

  $scope.openPost = function(post) {
    $state.go('tab.content-post', {postId: post.id});
  };

  $scope.$on('$ionicView.loaded', function() {
    $scope.refreshPosts();
  });
});
