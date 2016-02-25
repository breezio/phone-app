angular.module('breezio', ['ionic', 'ngStorage', 'breezio.content', 'breezio.chats', 'breezio.account'])

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

.factory('Config', function() {
  var config = {};
  config.host = 'https://health.breezio.com';
  config.api = '/api/1';
  config.url = config.host + config.api;
  return config;
})

.run(function($ionicPlatform, Auth, Chats, Roster) {

  Auth.init();
  Chats.init();
  Roster.init();

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

.filter('static', function(Config) {
  return function(input) {
    if (input) {
      if (input.substring(0, 4) == 'http') {
        return input
      } else {
        return Config.host + input;
      }
    } else {
      return input;
    }
  };
})

.controller('NavCtrl', function($scope, $rootScope, $ionicHistory) {
  $scope.backText = '';
  $scope.goBack = function() {
    $ionicHistory.goBack();
  }
})

.controller('TabCtrl', function($scope, $rootScope, $location, Auth, Chats) {
  $scope.loggedIn = Auth.loggedIn();
  $scope.haveChats = false;
  $scope.newChats = 0;
  $scope.unread = {};
  $scope.moveDown = {};

  $scope.$watch('unread', function(val) {
  });

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

  $rootScope.$on('chat:new-message', function(e, msg) {
    var loc = $location.url().split('/');
    loc.shift();
    loc.shift();

    if (loc[0] == 'chats' && loc[1] == msg.hash) {
    } else {
      if (!$scope.unread[msg.hash]) {
        $scope.unread[msg.hash] = 0;
      }

      $scope.unread[msg.hash] += 1;
      $scope.newChats += 1;

      Chats.addMessage(msg.hash, msg);
      $scope.moveDown[msg.hash] = true;

      $scope.$digest();
    }
  });

  $scope.$on('$locationChangeStart', function(e, url) {
    var loc = url.split('/');
    loc.shift();
    loc.shift();
    loc.shift();
    loc.shift();
    loc.shift();

    if (loc[0] == 'chats' && $scope.unread[loc[1]] > 0) {
      $scope.newChats -= $scope.unread[loc[1]];
      $scope.unread[loc[1]] = 0;

      if ($scope.moveDown[loc[1]]) {
        $rootScope.$broadcast('chat:offscreen-update');
      }
    }
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
  .state('tab.chats-detail', {
    url: '/chats/:hash',
    views: {
      'tab-chats': {
        templateUrl: 'templates/chats-detail.html',
        controller: 'ChatsDetailCtrl'
      }
    }
  })

  .state('tab.roster', {
    url: '/roster',
    views: {
      'tab-roster': {
        templateUrl: 'templates/tab-roster.html',
        controller: 'RosterCtrl'
      }
    }
  })
  .state('tab.roster-detail', {
    url: '/roster/:hash',
    views: {
      'tab-roster': {
        templateUrl: 'templates/roster-detail.html',
        controller: 'ChatsDetailCtrl'
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
