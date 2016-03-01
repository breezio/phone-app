angular.module('breezio.content.users', [])

.factory('User', function($http, $q, Config) {
  var users = {};
  var funcs = {};

  funcs.get = function(userId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: Config.url + '/users/' + userId,
      params: params
    });

    promise.success(function(val) {
      users[val.id] = val;
    });

    return promise;
  };

  funcs.getCached = function(userId, params) {
    return $q(function(resolve, reject) {
      if (users[userId]) {
        resolve(users[userId]);
      } else {
        funcs.get(userId, params).success(function(val) {
          resolve(val);
        }).error(function(val) {
          reject(val);
        });
      }
    });
  };

  return funcs;
})

.directive('breezioUser', function(Auth, Chats, $rootScope, $stateParams, $state) {
  return {
    templateUrl: 'templates/breezio-user.html',
    link: function(scope, element, attrs) {
      scope.openWebsite = function() {
        if (scope.user.website) {
          window.open(scope.user.website, '_system');
        }
      };

      scope.message = function() {
        var hash = Chats.generateHash([scope.user.id]);
        $state.go('tab.chats-detail', {hash: hash});
      };

      if (attrs.profile == '') {
        scope.profile = true;
      }

      scope.$parent.$watch('user', function(user) {
        if (user && user.then) {
          user.then(function(val) {
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

  $scope.$on('$ionicView.beforeEnter', function() {
    User.getCached($stateParams.userId).then(function(u) {
      $scope.user = u;
    });
  });
});
