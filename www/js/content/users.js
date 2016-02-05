angular.module('breezio.content.users', [])

.factory('User', function($http, $rootScope) {
  return {
    get: function(userId, params) {
      var params = angular.extend({}, params);

      return $http({
        method: 'GET',
        url: $rootScope.config.url + '/users/' + userId,
        params: params
      });
    }
  };
})

.directive('breezioUser', function(User, $stateParams) {
  var user = User.get($stateParams.userId);

  return {
    templateUrl: 'templates/breezio-user.html',
    link: function(scope, element, attrs) {
      scope.refreshUser = function() {
        User.get($stateParams.userId).success(function(val) {
          scope.user = val;
        }).finally(function() {
          scope.$broadcast('scroll.refreshComplete'); 
        });;
      };

      user.success(function(val) {
        scope.user = val;
      });
    }
  };
});
