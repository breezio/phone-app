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

.factory('Chats', function($http, $rootScope, ChatToken) {
  var funcs = {};

  funcs.get = function(params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: $rootScope.config.url + '/conversations',
      params: params
    });

    return promise;
  };

  return funcs;
})

.controller('ChatsCtrl', function($scope, $rootScope, Auth, Chats) {
  $scope.loaded = false;

  $rootScope.$on('chat:token', function() {
    $scope.user = Auth.user();

    Chats.get().success(function(chats) {
      $rootScope.$broadcast('chat:chats', chats);
      console.log(chats);
      $scope.chats = chats;
      $scope.loaded = true;
    });
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loaded = false;
  });
});
