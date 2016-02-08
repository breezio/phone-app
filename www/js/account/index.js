angular.module('breezio.account', ['http-auth-interceptor'])

.factory('Auth', function($http, $rootScope, $localStorage, authService, Config) {
  var self = this;
  this.oauthUrl = $rootScope.config.url + '/oauth2/token';
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
    if ($localStorage.auth && $localStorage.auth.access_token && $localStorage.user) {
      $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.auth.access_token;
      self.user = $localStorage.user;
      self.loggedIn = true;
      $rootScope.$broadcast('event:logged-in');
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
        $rootScope.$broadcast('event:logged-in');
      } else {
        self.funcs.reset();
        $rootScope.$broadcast('event:login-failed', res, status);
      }
    }).error(function(data, status, headers, config) {
      self.funcs.reset();
      $rootScope.$broadcast('event:login-failed', data, status);
    });
  };

  this.funcs.logout = function() {
    self.funcs.reset();
    self.loggedIn = false;
    $rootScope.$broadcast('event:logged-out');
  };

  this.funcs.reset = function() {
    self.user = null;
    delete $localStorage.user;
    delete $localStorage.auth;
    delete $http.defaults.headers.common.Authorization;
  };

  return self.funcs;
})

.controller('AccountCtrl', function($scope, $rootScope, Auth) {
  $scope.loginForm = {
    username : '',
    password : ''
  };

  $scope.loggedIn = Auth.loggedIn();

  if ($scope.loggedIn) {
    $scope.user = Auth.user();
    console.log('Logged in');
  }

  $scope.login = function() {
    Auth.login($scope.loginForm);
  };

  $scope.logout = function() {
    Auth.logout();
  };

  $rootScope.$on('event:logged-in', function() {
    $scope.loggedIn = Auth.loggedIn();
    $scope.user = Auth.user();
    console.log('Logged in');
  });

  $rootScope.$on('event:logged-out', function() {
    $scope.loggedIn = Auth.loggedIn();
    $scope.user = null;
    console.log('Logged out');
  });
});
