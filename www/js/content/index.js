angular.module('breezio.content', ['breezio.content.posts', 'breezio.content.users', 'breezio.content.notes'])

.controller('ContentCtrl', function($scope, $rootScope, $state, $timeout, Posts, Config) {
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

      var content = angular.element(document.querySelector('ion-content.content'));
      content.removeClass('fade-in');
      $timeout(function() {
        content.addClass('fade-in');
      }, 50);
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
      var content = angular.element(document.querySelector('ion-content.content'));
      content.removeClass('enter');
      $scope.refreshPosts();
      $scope.portal = Config.portal;
      $rootScope.reload = false;
    }
  });
});
