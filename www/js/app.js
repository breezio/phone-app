angular.module('breezio', ['ionic', 'ngStorage', 'breezio.content', 'breezio.chats', 'breezio.account'])

.factory('Config', function($rootScope) {
  $rootScope.config = {};
  $rootScope.config.host = 'https://health.breezio.com';
  $rootScope.config.api = '/api/1';
  $rootScope.config.url = $rootScope.config.host + $rootScope.config.api;

  return true;
})

.run(function($ionicPlatform, $rootScope, Auth) {

  $rootScope.config = {};
  $rootScope.config.host = 'https://health.breezio.com';
  $rootScope.config.api = '/api/1';
  $rootScope.config.url = $rootScope.config.host + $rootScope.config.api;

  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }

    Auth.init();
  });
})

.filter('static', function($rootScope) {
  return function(input) {
    if (input) {
      return $rootScope.config.host + input;
    } else {
      return input;
    }
  };
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
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
