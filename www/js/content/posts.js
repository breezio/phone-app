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
      })
    }
  };
})

.directive('breezioPost', function() {
  return {
    template: 'asdfasdfsadfdsafasdf'
  };
})

.controller('PostCtrl', function($scope, $rootScope) {
  $scope.refreshPost = function() {
    $scope.$broadcast('scroll.refreshComplete');
  };
});
