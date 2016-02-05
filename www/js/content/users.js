angular.module('breezio.content.users', [])

.factory('User', function($http, $rootScope) {
  var users = {};
  var funcs = {};

  funcs.get = function(userId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: $rootScope.config.url + '/users/' + userId,
      params: params
    });

    promise.success(function(val) {
      users[val.id] = val;
    });

    return promise;
  };

  funcs.getCached = function(userId, params) {
    if (users[userId]) {
      return {
        success: function(cb) {
          if (cb) {
            cb(users[userId]);
          }
        }
      };
    } else {
      return funcs.get(userId, params);
    }
  };

  return funcs;
})

.directive('breezioUser', function(User, $rootScope, $stateParams) {
  var user = User.getCached($stateParams.userId);

  $rootScope.$on('userView.loaded', function() {
    user = User.getCached($stateParams.userId);
  });

  return {
    templateUrl: 'templates/breezio-user.html',
    link: function(scope, element, attrs) {
      scope.openWebsite = function() {
        if (scope.user.website) {
          window.open(scope.user.website, '_system');
        }
      };

      user.success(function(val) {
        scope.user = val;
        scope.loaded = true;
      });
    }
  };
})

.controller('UserCtrl', function($scope, $rootScope) {
  $scope.$on('$ionicView.loaded', function() {
    $rootScope.$broadcast('userView.loaded');
  });
});
