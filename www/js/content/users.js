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

.directive('breezioUser', function(User, Auth, $rootScope, $stateParams) {
  return {
    templateUrl: 'templates/breezio-user.html',
    link: function(scope, element, attrs) {
      scope.openWebsite = function() {
        if (scope.user.website) {
          window.open(scope.user.website, '_system');
        }
      };

      if (attrs.profile == '') {
        scope.profile = true;
      }

      scope.$parent.$watch('user', function(user) {
        if (user && user.success) {
          user.success(function(val) {
            scope.user = val;
            scope.loaded = true;
            scope.loggedIn = Auth.loggedIn();
          });
        }

        if (user && user.id) {
          scope.user = user;
          scope.loaded = true;
          scope.loggedIn = Auth.loggedIn();
        }

        if (!user) {
          scope.loggedIn = false;
        }
      });

      $rootScope.$on('auth:logged-in', function() {
        scope.loggedIn = true;
      });

      $rootScope.$on('auth:logged-out', function() {
        scope.loggedIn = false;
      });
    }
  };
})

.controller('UserCtrl', function($scope, $rootScope, User, $stateParams) {
  $scope.refreshUser = function() {
    $scope.user = User.get($stateParams.userId);
    $scope.user.success(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.$on('$ionicView.loaded', function() {
    $scope.user = User.getCached($stateParams.userId);
  });
});
