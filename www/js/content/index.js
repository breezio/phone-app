angular.module('breezio.content', ['breezio.content.posts', 'breezio.content.users', 'breezio.content.notes'])

.run(function($rootScope) {
  $rootScope.posts = {};
})

.controller('ContentCtrl', function($scope, $rootScope, $state, Posts, Config) {
  $scope.loading = true;
  $scope.start = 0;
  $scope.exhausted = false;
  $scope.posts = [];
  $scope.portal = Config.portal;

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

  $scope.$on('$ionicView.enter', function() {
    if ($rootScope.reload) {
      $scope.refreshPosts();
      $scope.portal = Config.portal;
      $rootScope.reload = false;
    }
  });
});
