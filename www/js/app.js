angular.module('breezio', ['ionic', 'ngStorage', 'breezio.content', 'breezio.chats', 'breezio.account', 'ionic-native-transitions'])

.run(function($rootScope) {
  var a = $rootScope.$on('auth:logged-in', function(e) {
    console.log('Logged in');
    a();
  });

  var b = $rootScope.$on('auth:logged-out', function() {
    console.log('Logged out');
    b();
  });

  var c = $rootScope.$on('auth:login-failed', function() {
    console.log('Login failed');
    c();
  });

  var d = $rootScope.$on('chat:token', function() {
    console.log('Chat token fetched');
    d();
  });

  var e = $rootScope.$on('chat:chats', function() {
    console.log('Chats fetched');
    e();
  });
})

.factory('Config', function() {
  var config = {};
  config.host = 'https://health.breezio.com';
  config.api = '/api/1';

  if (window.cordova)
    config.host = 'https://health.breezio.com';

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
})

.controller('TabCtrl', function($scope, $rootScope, $location, $state, $ionicHistory, $ionicNativeTransitions, $ionicTabsDelegate, Auth, Chats) {
  $scope.loggedIn = Auth.loggedIn();
  $scope.newChats = $rootScope.totalUnread;
  $scope.state = {};

  $scope.select = function(state, index) {
    if (!$scope.state[state] || $ionicTabsDelegate.selectedIndex() == index) {
      var view = {stateName: state, stateParams: {}};
      $ionicHistory.nextViewOptions({disableBack: true});
    } else {
      var view = $scope.state[state];
    }

    $ionicNativeTransitions.stateGo(view.stateName, view.stateParams, {
      type: 'fade',
      duration: 100
    });
  };

  $scope.saveState = function(state) {
    var view = $ionicHistory.viewHistory().currentView;
    $scope.state[state] = view;
  };

  $rootScope.$watch('totalUnread', function(val) {
    $scope.newChats = val;
  });

  $rootScope.$on('auth:logged-in', function() {
    $scope.loggedIn = true;
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loggedIn = false;
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $ionicNativeTransitionsProvider) {

  $ionicNativeTransitionsProvider.setDefaultOptions({
    duration: 200,
    slowdownfactor: 1,
    fixedPixelsBottom: 49,
    backInOppositeDirection: true,
  });

  $ionicConfigProvider.tabs.position('bottom');

  $stateProvider

  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabCtrl'
  })

  .state('tab.content', {
    url: '/content',
    nativeTransitions: null,
    views: {
      'tab-content': {
        templateUrl: 'templates/content-tab.html',
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
  .state('tab.content-notes', {
    url: '/post/:postId/notes/:noteId',
    views: {
      'tab-content': {
        templateUrl: 'templates/content-notes.html',
        controller: 'NoteCtrl'
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
    nativeTransitions: null,
    views: {
      'tab-chats': {
        templateUrl: 'templates/chats-tab.html',
        controller: 'ChatsCtrl'
      }
    }
  })
  .state('tab.chats-chat', {
    url: '/chats/:hash',
    views: {
      'tab-chats': {
        templateUrl: 'templates/chat.html',
        controller: 'ChatCtrl'
      }
    }
  })

  .state('tab.roster', {
    url: '/roster',
    nativeTransitions: null,
    views: {
      'tab-roster': {
        templateUrl: 'templates/roster-tab.html',
        controller: 'RosterCtrl'
      }
    }
  })

  .state('tab.account', {
    url: '/account',
    nativeTransitions: null,
    views: {
      'tab-account': {
        templateUrl: 'templates/account-tab.html',
        controller: 'AccountCtrl'
      }
    }
  });

  $urlRouterProvider.otherwise('/tab/content');

});
