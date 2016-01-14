var open;
var close;
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


    $scope.open = $rootScope.pushNote = function(data) {
      $scope.title = data.title;
      $scope.body = data.body;
      $scope.imagePath = data.imagePath;

      if ($scope.show == true) {
        clearTimeout(auto);
      } else {
        $scope.show = true;
      }

      var note = document.getElementById('note');
      note.ondrag = function(e) {
        var left = e.gesture.deltaX.toString() + "px";
        note.style.left = left;
        $scope.close();
      };

      auto = setTimeout(function() {
        $scope.close();
      }, 3000);
    };

    $scope.close = $rootScope.closeNote = function() {
      $scope.show = false;
      $scope.$digest();

      setTimeout(function() {
        var note = document.getElementById('note');
        if (note) {
          note.style.left = 0;
        }
      }, 250);
    };
  });
