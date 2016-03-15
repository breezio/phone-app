angular.module('breezio.content.notes', [])

.controller('NoteCtrl', function($scope, $rootScope, $q, $stateParams, Post) {

  $scope.loadPost = function() {
    return $q(function(resolve, reject) {
      Post.getCached($stateParams.postId).success(function(ret) {
        resolve(ret);
      });
    });
  };

  $scope.$on('$ionicView.beforeEnter', function() {
    var promises = [];

    $scope.loadPost().then(function(post) {
      $scope.post = post;
      $scope.postLoaded = true;
    });
  });
});
