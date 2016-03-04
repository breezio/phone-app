angular.module('breezio.chats.chat', [])

.controller('ChatCtrl', function($scope, $rootScope, $stateParams, User, Auth, Chats, $ionicScrollDelegate, $timeout, $ionicHistory, $q) {

  $scope.users = {};

  $scope.goBack = function() {
    $ionicHistory.goBack();
  };

  $scope.formatLine = function(lines, index) {
    return text;
  };
});
