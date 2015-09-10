angular.module('neo', ['ionic', 'ngStorage', 'ngCordova.plugins', 'neo.base', 'neo.user', 'neo.post', 'neo.conversation', 'neo.question', 'neo.people'])

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

.controller('TabCtrl', function($scope, $rootScope) {
  $scope.loggedIn = false;
  $rootScope.$watch('currentUser', function(val) {
    $scope.loggedIn = val != false ? true : false;
  });
});

