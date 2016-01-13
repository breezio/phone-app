var open;
var close;
angular.module('neo.notifications', [])
  .run(function($rootScope, $ionicPopover) {
  })
  .controller('NoteCtrl', function($scope, $rootScope) {
    $scope.show = false;

    $scope.open = $rootScope.pushNote = function(data) {
      $scope.show = true;
      $scope.title = data.title;
      $scope.body = data.body;
      $scope.imagePath = data.imagePath;
      console.log(data);

      var auto = setTimeout(function() {
        $scope.close();
      }, 3000);
    };

    $scope.close = $rootScope.closeNote = function() {
      $scope.show = false;
      $scope.$digest();
    };
  });
