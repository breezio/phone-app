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

.factory('Chats', function($http, $rootScope, $q, ChatToken, Auth, User) {
  var funcs = {};
  var chatToken = null;
  var chats = null;
  var fetched = false;

  funcs.get = function(params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: $rootScope.config.url + '/conversations',
      params: params
    });

    return promise;
  };

  funcs.chatToken = function() {
    return chatToken;
  };

  funcs.chats = function() {
    return chats;
  };

  funcs.fetched = function() {
    return fetched;
  };

  funcs.init = function() {
    $rootScope.$on('chat:token', function(token) {
      chatToken = token;

      funcs.get().success(function(val) {
        var promises = [];

        val.items.forEach(function(chat) {
          chat.userData = {};
          chat.us = Auth.user();

          chat.users.forEach(function(userId) {
            if (chat.us.id != userId) {
              promises.push(User.getCached(userId).success(function(user) {
                chat.userData[userId] = user;
              }));
            }
          });
        });

        $q.all(promises).then(function() {
          chats = val.items;
          fetched = true;
          $rootScope.$broadcast('chat:chats', val.items);
        });
      });
    });

    $rootScope.$on('auth:logged-out', function() {
      chats = null;
      chatToken = null;
      fetched = false;
    });
  };

  return funcs;
})

.controller('ChatsCtrl', function($scope, $rootScope, Auth, Chats) {
  $scope.loaded = false;

  $scope.parseChats = function(chats) {
    $scope.user = Auth.user();
    $scope.chats = chats;

    $scope.chats.forEach(function(chat) {
      chat.others = [];
      chat.usernames = [];

      chat.users.forEach(function(user) {
        if (chat.us.id != user) {
          chat.others.push(user);
          chat.usernames.push(chat.userData[user].username);
        }
      });

      if (!chat.title) {
        chat.title = chat.usernames.join(', ');
      }
    });

    $scope.loaded = true;
  };

  $scope.$on('$ionicView.beforeEnter', function() {
    if (Chats.fetched() && !$scope.loaded) {
      $scope.parseChats(Chats.chats());
    }
  });

  $rootScope.$on('chat:chats', function(e, chats) {
    $scope.parseChats(chats);
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loaded = false;
  });
});
