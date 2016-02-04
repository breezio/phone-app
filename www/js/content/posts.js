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
    template: '<div class="item">{{post.content}}</div>'
  };
})

.controller('PostCtrl', function($scope, $stateParams, Post) {
  $scope.post = {};
  $scope.expanded = false;

  $scope.refreshPost = function() {
    Post.get($stateParams.postId).then(function(res) {
      $scope.post = res.data;
      $scope.post.dateString = (new Date($scope.post.creationDate)).toDateString();
      console.log($scope.post);
    }).finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.expand = function() {
    $scope.expanded = !$scope.expanded;
  };

  $scope.$on('$ionicView.loaded', function() {
    $scope.refreshPost();
  });
});
