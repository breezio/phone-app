angular.module('neo.settings.controllers', [])

    .controller('SettingsCtrl', function($scope, $rootScope, Auth) {
      $scope.loggedIn = $rootScope.loggedIn;
      $scope.currentUser = $rootScope.currentUser;
      $scope.showUser = $rootScope.showUser;
      $scope.showLogin = Auth.showLogin;
      $scope.logout = Auth.logout;
      $scope.showRegistration = $rootScope.showRegistration;
    })
    .controller('ProfileCtrl', function($scope, $rootScope, Auth) {
    });
