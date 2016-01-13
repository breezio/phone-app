var open;
var close;
angular.module('neo.notifications', [])
  .run(function($rootScope, $ionicPopover) {
  })
  .controller('NoteCtrl', function($scope, $rootScope) {
    $scope.show = false;
    var auto;

    $scope.open = $rootScope.pushNote = function(data) {
      $scope.title = data.title;
      $scope.body = data.body;
      $scope.imagePath = data.imagePath;

      if ($scope.show == true) {
        clearTimeout(auto);
      } else {
        $scope.show = true;
      }

      auto = setTimeout(function() {
        $scope.close();
      }, 3000);
    };

    $scope.close = $rootScope.closeNote = function() {
      $scope.show = false;
      $scope.$digest();
    };
  });
