angular.module('breezio.content.posts', [])

.factory('Posts', function($http, $rootScope) {
  return {
    get: function(params) {
      var params = angular.extend({
        limit: 20,
        start: 0
      }, params);


      return $http({
        method: 'GET',
        url: $rootScope.config.url + 'posts',
        params: params
      });
    }
  };
})

.factory('Post', function($http, $rootScope) {
  return {
    get: function(postId, params) {
      var params = angular.extend({}, params);

      return $http({
        method: 'GET',
        url: $rootScope.config.url + 'posts/' + postId,
        params: params
      });
    }
  };
})

.directive('breezioPost', function() {
  return {
    templateUrl: 'templates/breezio-post.html'
  };
})

.controller('PostCtrl', function($scope, $stateParams, Post) {
  $scope.post = {};

  $scope.refreshPost = function() {
    Post.get($stateParams.postId).then(function(res) {
      $scope.post = res.data;
    }).finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.$on('$ionicView.loaded', function() {
    $scope.refreshPost();
  });

  $scope.$on('$ionicView.beforeEnter', function() {
  });
});
