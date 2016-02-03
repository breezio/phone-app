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
});
