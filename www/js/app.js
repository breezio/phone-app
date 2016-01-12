angular.module('neo', ['ionic', 'ngStorage', 'ngCordova.plugins', 'angular-md5', 'neo.base', 'neo.user', 'neo.settings', 'neo.post', 'neo.conversation', 'neo.question', 'neo.people', 'neo.tags', 'neo.chat', 'neo.notifications'])

.run(function($ionicPlatform, $state, $rootScope, $location, $ionicSideMenuDelegate, $http, $cordovaPush, $cordovaDevice, $cordovaGeolocation, Auth, Config) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    $rootScope.config = Config;

    $rootScope.$on('pushNotificationReceived', function(e) {
      event = e.detail;
      console.log('Event: ', JSON.stringify(event));
      if (event.foreground == 0) {
        if (event.page) {
          $location.url(event.page);
        }
      }

      if (event.badge)
        $cordovaPush.setBadgeNumber(event.badge);

    }, this);

    Auth.init();

    if (Auth.user) {
      $cordovaPush.register({
        'badge': 'true',
        'sound': 'true',
        'alert': 'true',
      }).then(function(token) {

        $http.post(Config.apiUrl + '/user/devices', {
          registrationId: token,
          deviceType: $cordovaDevice.getPlatform(),
          model: $cordovaDevice.getModel(),
          version: Config.version,
        }).success(function(data) {
          console.log(data);
        }).error(function(err) {
          console.log('Errrr:', err);
        });

      }, function(err) {
        console.log('Err:', err);
      });
    }


    $cordovaGeolocation
      .getCurrentPosition()
      .then(function(position) {
        console.log('Latitude: '          + position.coords.latitude          + '\n' +
                    'Longitude: '         + position.coords.longitude         + '\n' +
                    'Accuracy: '          + position.coords.accuracy);
      }, function(err) {
        // error
        console.log('Why?');

      });


  });

})

.config(function($stateProvider, $urlRouterProvider, $httpProvider, $resourceProvider) {

  $stateProvider
    .state('tab', {
      url: '/tab',
      abstract: true,
      templateUrl: 'templates/tabs.html',
    });

  $urlRouterProvider.otherwise('/tab/posts');

})

.factory('ModalViews', function($ionicModal) {
  var modalViews = {};
  var funcs = {};
  funcs.register = function(id, path) {
    var callback = null;
    $ionicModal.fromTemplateUrl(path, {
      animation: 'slide-in-up',
      id: id,
    }).then(function(modal) {
      modalViews[id] = modal;
      if (callback != null) {
        callback(modal);
      }
    });

    var after = {
      then: function(cb) {
        callback = cb;
      },
    };
    return after;
  };

  funcs.get = function(id) {
    return modalViews[id];
  };

  return funcs;
})

.controller('TabCtrl', function($scope, $rootScope, $localStorage, $ionicTabsDelegate) {
  if ($localStorage.user != undefined) {
    $rootScope.loggedIn = true;
  }
  $rootScope.$watch('loggedIn', function(val) {
    $scope.loggedIn = val;
  });

  $scope.newChats = undefined;
  $rootScope.$on('chat:new-chat', function(e, c) {
    if (c.text && !$rootScope.chat) {
      if (!$scope.newChats) {
        $scope.newChats = 0;
      }

      $scope.newChats += 1;
    }
  });

  $rootScope.$on('chat:clear-new-chats', function() {
    $scope.newChats = undefined;
  });

  $scope.selectTab = function(href) {
    for (var i = 0; i < $scope.tabs.length; i++) {
      if ($scope.tabs[i].href == href) {
        if ($ionicTabsDelegate.selectedIndex() == i) {
          window.location = href;
        } else {
          $ionicTabsDelegate.select(i);
        }
      }
    }
  };

  $scope.tabs = [];
  $scope.$watch('$$childTail', function(val) {
    if (val != null) {
      var prev = $scope.$$childTail;
      while (prev != null) {

        $scope.tabs = $scope.tabs.concat(prev);
        prev = prev.$$prevSibling;
      }
      $scope.tabs.reverse();
    }
  });
});

