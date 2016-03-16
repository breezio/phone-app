angular.module('breezio.account', ['http-auth-interceptor'])

.factory('Auth', function($http, $rootScope, $localStorage, authService, ChatToken, Config, $state, $ionicLoading, $timeout) {
  var self = this;
  this.oauthUrl = Config.url + '/oauth2/token';
  this.user = null;
  this.loggedIn = false;
  this.funcs = {};

  this.funcs.loggedIn = function() {
    return self.loggedIn;
  };

  this.funcs.user = function() {
    return self.user;
  };

  this.funcs.init = function() {
    $rootScope.$on('event:auth-loginRequired', function(e, rejection) {
      console.log('Login required');
      $state.go('tab.account');
      self.funcs.logout();
      $ionicLoading.show({
        template: 'Login required...',
        duration: 1000
      });
    });

    if ($localStorage.auth && $localStorage.auth.access_token && $localStorage.user) {
      $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.auth.access_token;
      self.user = $localStorage.user;
      self.loggedIn = true;
      $rootScope.$broadcast('auth:logged-in');

      ChatToken.get().success(function(token) {
        $rootScope.chatToken = token;
        $rootScope.$broadcast('chat:token', token);
      });
    }
  };

  this.funcs.login = function(user) {
    var data = angular.extend(user, {
      grant_type: 'password',
      client_id: 'phoneapp'
    });

    $http.post(self.oauthUrl, data).success(function(res) {
      if (res.access_token && res.refresh_token) {
        $localStorage.auth = {
          access_token: res.access_token,
          refresh_token: res.refresh_token
        };

        self.user = $localStorage.user = res.user;
        $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.auth.access_token;
        authService.loginConfirmed(res, function(config) {
          config.headers.Authorization = 'Bearer ' + $localStorage.auth.access_token;
          return config;
        });

        self.loggedIn = true;
        $rootScope.$broadcast('auth:logged-in');

        ChatToken.get().success(function(token) {
          $rootScope.chatToken = token;
          $rootScope.$broadcast('chat:token', token);
        });
      } else {
        self.funcs.reset();
        $rootScope.$broadcast('auth:login-failed', res, status);
      }
    }).error(function(data, status, headers, config) {
      self.funcs.reset();
      $rootScope.$broadcast('auth:login-failed', data, status);
    });
  };

  this.funcs.logout = function() {
    self.funcs.reset();
    self.loggedIn = false;
    $rootScope.$broadcast('auth:logged-out');
  };

  this.funcs.reset = function() {
    self.user = null;
    delete $localStorage.user;
    delete $localStorage.auth;
    delete $http.defaults.headers.common.Authorization;
  };

  this.funcs.refresh = function() {
    if (self.refreshingToken) {
      return;
    }

    self.refreshingToken = true;

    if (!$localStorage.auth || !$localStorage.auth.refresh_token) {
      $state.go('tab.account');
    }

    delete $http.defaults.headers.common.Authorization;
    delete $localStorage.auth.access_token;

    $http.post(self.oauthUrl, {
      grant_type: 'refresh_token',
      client_id: 'phoneapp',
      refresh_token: $localStorage.auth.refresh_token
    }).success(function(res) {
      self.refreshingToken = false;
      console.log(res);
      if (res.access_token) {
        $localStorage.auth.access_token = res.access_token;
        self.user = $localStorage.user = res.user;
        $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.auth.access_token;

        authService.loginConfirmed(res, function(config) {
          config.headers.Authorization = 'Bearer ' + $localStorage.auth.access_token;
          return config;
        });
      } else {
        $state.go('tab.account');
      }
    }).error(function(res) {
      self.refreshingToken = false;
      $state.go('tab.account');
    });
  };

  return self.funcs;
})

.directive('loggedIn', function($rootScope, Auth) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var set = function() {
        if (Auth.loggedIn()) {
          element.removeClass('ng-hide');
        } else {
          element.addClass('ng-hide');
        }
      };

      set();

      $rootScope.$on('auth:logged-in', function() {
        set();
      });

      $rootScope.$on('auth:logged-out', function() {
        set();
      });
    }
  };
})

.directive('loggedOut', function($rootScope, Auth) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var set = function() {
        if (Auth.loggedIn()) {
          element.addClass('ng-hide');
        } else {
          element.removeClass('ng-hide');
        }
      };

      set();

      $rootScope.$on('auth:logged-in', function() {
        set();
      });

      $rootScope.$on('auth:logged-out', function() {
        set();
      });
    }
  };
})

.controller('AccountCtrl', function($scope, $rootScope, $ionicLoading, Auth) {
  $scope.loginForm = {
    username : '',
    password : ''
  };

  $scope.loggedIn = Auth.loggedIn();

  if ($scope.loggedIn) {
    $scope.user = Auth.user();
  }

  $scope.login = function() {
    $rootScope.$on('auth:logged-in', function() {
      $ionicLoading.hide();
    });

    $rootScope.$on('auth:login-failed', function() {
      $ionicLoading.hide();
      $ionicLoading.show({
        template: 'Login failed...',
        duration: 1000
      });
    });

    $ionicLoading.show({
      template: 'Logging in...'
    });

    Auth.login($scope.loginForm);
  };

  $scope.logout = function() {
    Auth.logout();
  };

  $rootScope.$on('auth:logged-in', function() {
    $scope.loggedIn = Auth.loggedIn();
    $scope.user = Auth.user();
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loggedIn = Auth.loggedIn();
    $scope.user = null;
  });
});
