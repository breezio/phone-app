angular.module('neo.user.controllers', [])

    .controller('UserLoginCtrl', function ($scope, Auth, $location, $ionicNavBarDelegate, $ionicModal) {



    })

    .controller('UserShowCtrl', function($scope, $stateParams, User) {
      $scope.user = User.get({userId: $stateParams.userId}, function() {
        console.log($scope.user);
      });
    });
