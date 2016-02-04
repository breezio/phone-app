angular.module('breezio', ['ionic', 'breezio.content', 'breezio.chats', 'breezio.account'])

.run(function($ionicPlatform, $rootScope) {

  $rootScope.config = {
    url: 'https://health.breezio.com/api/1/'
  };

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
