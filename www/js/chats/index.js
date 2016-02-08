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

.controller('ChatsCtrl', function($scope, $rootScope, $q, Auth, Chats, User) {
  $scope.loaded = false;

  $rootScope.$on('chat:token', function() {
    $scope.user = Auth.user();

    Chats.get().success(function(val) {
      $rootScope.$broadcast('chat:chats', val.items);
      var promises = [];

      val.items.forEach(function(chat, i) {
        chat.userData = {};
        chat.usernames = [];
        chat.users.forEach(function(user, j) {
          if (user != $scope.user.id) {
            promises.push(User.getCached(user).success(function(val) {
              chat.userData[user] = val;
              chat.usernames.push(val.username);
            }));
          }
        });
      });

      $q.all(promises).then(function() {
        $scope.chats = val.items;
        $scope.loaded = true;
        $rootScope.$broadcast('chat:loaded');
      });
    });
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loaded = false;
  });
});
