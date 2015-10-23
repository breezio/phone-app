angular.module('neo.user.services', ['http-auth-interceptor'])

	.factory('User', function(Resource) {
  var actions = {
      subscribe: {
        method: 'POST',
        url: '/subscription/user/:userId',
      },
      unsubscribe: {
        method: 'DELETE',
        url: '/subscription/user/:userId',
      },
      update: {
        method: 'PUT',
        url: '/users/:userId',
        cache: false,
      },
    };

  return Resource('/users/:userId/:data', {fields: 'isFollowing'}, actions);
	})

	.service('Auth', function($http, Config, $localStorage, $rootScope, $location, $ionicLoading, $ionicModal, authService) {
  var oauthUrl = Config.apiUrl + '/oauth2/token';
  var self = this;
  $rootScope.currentUser = this.user = false;
  this.refreshingToken = false;
  window._Auth = this;

  this.init = function() {

    $rootScope.$on('event:auth-loginRequired', function(e, rejection) {
      self.refreshToken();
    });

    if ($localStorage.auth && $localStorage.auth.access_token && $localStorage.user) {
      $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.auth.access_token;
      $rootScope.currentUser = self.user = $localStorage.user;

    }

    var $loginScope = $rootScope.$new();

    $loginScope.loginForm = {};
    $loginScope.loginForm.username = '';
    $loginScope.loginForm.password = '';
    $loginScope.login = function() {
      $loginScope.loginForm.message = '';
      self.login($loginScope.loginForm);
    }

    $loginScope.hide = function() {
      self.loginModal.hide();
    }

    $ionicModal.fromTemplateUrl('js/modules/user/templates/login.html', function(modal) {
      self.loginModal = modal;
    }, {
      scope: $loginScope,
      animation: 'slide-in-up',
      focusFirstInput: true,
    });

    $loginScope.$on('event:auth-loginConfirmed', function() {
      $loginScope.loginForm.message = '';
      $loginScope.loginForm.username = '';
      $loginScope.loginForm.password = '';
      $location.url('/');
    });

    $loginScope.$on('event:auth-login-failed', function(e, data) {
      $loginScope.loginForm.message = 'Invalid username or password';
    });


    $loginScope.$on('$destroy', function() {
      if (self.loginModal) {
        self.loginModal.remove();
      }
    });

    $loginScope.$on('event:auth-loginConfirmed', function(e, rejection) {
      self.loginModal.hide();
    });
    $loginScope.$on('event:auth-show-login', function(e, rejection) {
      self.loginModal.show();
    });

  }

  this.login = function(user) {
    var data = angular.extend(user, {grant_type: 'password', client_id: 'phoneapp'});

    $http.post(oauthUrl, data)
				.success(function(response) {
  if (response.access_token && response.refresh_token) {
    $localStorage.auth = {
      access_token: response.access_token,
      refresh_token: response.refresh_token,
    };

    $rootScope.currentUser = self.user = $localStorage.user = response.user;
    $rootScope.loggedIn = true;
    $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.auth.access_token;
    authService.loginConfirmed(response, function(config) {
      config.headers.Authorization = 'Bearer ' + $localStorage.auth.access_token
      return config;
    });
  } else {
    self.reset();
    $rootScope.$broadcast('event:auth-login-failed', response, status);
  }


				})
				.error(function(data, status, headers, config) {
  self.reset();
  $rootScope.$broadcast('event:auth-login-failed', data, status);
			    });				;
  };

  this.logout = function() {
    self.reset();
    $rootScope.$broadcast('event:auth-logout-complete');
    $location.url('/');
  }

  this.reset = function() {
    $rootScope.currentUser = self.user = false;
    $rootScope.loggedIn = false;
    delete $localStorage.user;
    delete $localStorage.auth;
    delete $http.defaults.headers.common.Authorization;
  }

  this.showLogin = function() {
    self.reset();
    $rootScope.$broadcast('event:auth-show-login');
  }

  this.refreshToken = function(options) {

    if (self.refreshingToken)
    return;

    self.refreshingToken = true;


    if (!$localStorage.auth || !$localStorage.auth.refresh_token) {
      self.showLogin();
    }

    delete $http.defaults.headers.common.Authorization;
    delete $localStorage.auth.access_token;

    $http.post(oauthUrl, {
      grant_type: 'refresh_token',
      client_id: 'phoneapp',
      refresh_token: $localStorage.auth.refresh_token,
    }).success(function(response) {
      self.refreshingToken = false;

      if (response.access_token) {
        $localStorage.auth.access_token = response.access_token;
        $rootScope.currentUser = self.user = $localStorage.user = response.user;
        $http.defaults.headers.common.Authorization = 'Bearer ' + $localStorage.auth.access_token;

        authService.loginConfirmed(response, function(config) {
          config.headers.Authorization = 'Bearer ' + $localStorage.auth.access_token
          return config;
        });

      } else {
        self.showLogin();
      }
    }).error(function(response) {
      self.refreshingToken = false;
      self.showLogin();
    });

  }

	}).config(function($httpProvider) {

	});

