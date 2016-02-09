angular.module('breezio', ['ionic', 'ngStorage', 'breezio.content', 'breezio.chats', 'breezio.account'])

.factory('Config', function($rootScope) {
  $rootScope.config = {};
  $rootScope.config.host = 'https://health.breezio.com';
  $rootScope.config.api = '/api/1';
  $rootScope.config.url = $rootScope.config.host + $rootScope.config.api;

  return true;
})

.run(function($rootScope) {
  $rootScope.$on('auth:logged-in', function() {
    console.log('Logged in');
  });

  $rootScope.$on('auth:logged-out', function() {
    console.log('Logged out');
  });

  $rootScope.$on('auth:login-failed', function() {
    console.log('Login failed');
  });

  $rootScope.$on('chat:token', function() {
    console.log('Chat token fetched');
  });

  $rootScope.$on('chat:chats', function() {
    console.log('Chats fetched');
  });
})

.run(function($ionicPlatform, $rootScope, Auth, Chats) {

  $rootScope.config = {};
  $rootScope.config.host = 'https://health.breezio.com';
  $rootScope.config.api = '/api/1';
  $rootScope.config.url = $rootScope.config.host + $rootScope.config.api;
  Auth.init();
  Chats.init();

  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.filter('static', function($rootScope) {
  return function(input) {
    if (input) {
      if (input.substring(0, 4) == 'http') {
        return input
      } else {
        return $rootScope.config.host + input;
      }
    } else {
      return input;
    }
  };
})

.controller('TabCtrl', function($scope, $rootScope, Auth) {
  $scope.loggedIn = Auth.loggedIn();
  $scope.haveChats = false;

  $rootScope.$on('auth:logged-in', function() {
    $scope.loggedIn = true;
  });

  $rootScope.$on('chat:chats', function() {
    $scope.haveChats = true;
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loggedIn = false;
    $scope.haveChats = false;
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabCtrl'
  })

  .state('tab.content', {
    url: '/content',
    views: {
      'tab-content': {
        templateUrl: 'templates/tab-content.html',
        controller: 'ContentCtrl'
      }
    }
  })
  .state('tab.content-post', {
    url: '/post/:postId',
    views: {
      'tab-content': {
        templateUrl: 'templates/content-post.html',
        controller: 'PostCtrl'
      }
    }
  })
  .state('tab.content-user', {
    url: '/user/:userId',
    views: {
      'tab-content': {
        templateUrl: 'templates/content-user.html',
        controller: 'UserCtrl'
      }
    }
  })

  .state('tab.chats', {
    url: '/chats',
    views: {
      'tab-chats': {
        templateUrl: 'templates/tab-chats.html',
        controller: 'ChatsCtrl'
      }
    }
  })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });

  $urlRouterProvider.otherwise('/tab/content');

});
