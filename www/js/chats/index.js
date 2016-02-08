angular.module('breezio.chats', [])

.factory('ChatToken', function($http, $rootScope) {
  return {
    get: function() {
      return $http({
        method: 'GET',
        url: $rootScope.config.url + '/chat/token'
      });
    }
  };
})

.factory('Chat', function($http, $rootScope, ChatToken) {
  var funcs = {};

  return funcs;
})

.controller('ChatsCtrl', function($scope, $rootScope, Auth) {
  $scope.loaded = false;

  $rootScope.$on('chat:token', function() {
    $scope.user = Auth.user();
    $scope.loaded = true;
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loaded = false;
  });
});
