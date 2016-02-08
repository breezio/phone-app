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

.controller('ChatsCtrl', function($scope, $rootScope) {
});
