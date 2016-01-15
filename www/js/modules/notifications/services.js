angular.module('neo.notifications', [])
  .filter('sanitize', function($sanitize) {
    return function(input) {
      if (typeof input == 'string') {
        return $sanitize(input);
      } else {
        return input;
      }
    };
  })
  .controller('NoteCtrl', function($scope, $rootScope) {
    $scope.show = false;
    var auto;

    $scope.open = $rootScope.pushNote = function(data, holdAction) {
      $scope.title = data.title;
      $scope.body = data.body;
      $scope.imagePath = data.imagePath;
      $scope.data = data;

      if ($scope.show == true) {
        clearTimeout(auto);
      } else {
        $scope.show = true;
      }

      var closed = false;
      $scope.onClose = function() {
        closed = true;
        $scope.close();
      };

      $scope.onClick = function(data) {
        setTimeout(function() {
          if (!closed) {
            if (typeof holdAction == 'function') {
              holdAction(data);
            }
            closed = false;
          }
          $scope.close();
        }, 100);
      };

      auto = setTimeout(function() {
        //$scope.close();
      }, 5000);
    };

    $scope.close = $rootScope.closeNote = function() {
      $scope.show = false;
    };
  });
