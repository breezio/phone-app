angular.module('breezio.chats', ['angular-md5', 'breezio.chats.detail'])

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

.factory('Chats', function($http, $rootScope, $q, md5, ChatToken, Auth, User) {
  var funcs = {};
  var chatToken = null;
  var chats = null;
  var messages = {};
  var fetched = false;
  var connection = null;
  var connected = false;

  funcs.get = function(params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: $rootScope.config.url + '/conversations',
      params: params
    });

    return promise;
  };

  funcs.generateHash = function(users, topic) {
    var id = Auth.user().id;
    if (users.indexOf(id) == -1) {
      users.push(id);
    }

    var key = users.sort().join(',');
    if (topic && topic.id) {
      key = topic.id + ',' + key;
    } else if (typeof topic == 'string') {
      key = topic + ',' + key;
    }

    return md5.createHash(key);
  };

  funcs.chatToken = function() {
    return chatToken;
  };

  funcs.chats = function() {
    return chats;
  };

  funcs.chat = function(hash) {
    for (var i = 0; i < chats.length; i++) {
      if (chats[i].hash == hash) {
        return chats[i];
      }
    }

    return null;
  };

  funcs.fetched = function() {
    return fetched;
  };

  funcs.connected = function() {
    return connected;
  };

  funcs.getMessages = function(hash, params) {
    var params = angular.extend({
      limit: 15
    }, params);

    var promise = $http({
      method: 'GET',
      url: $rootScope.config.url + '/conversations/' + hash + '/messages',
      params: params
    });

    promise.success(function(val) {
      messages[hash] = val;
    });

    return promise;
  };

  funcs.messages = function(hash, params) {
    if (messages[hash].length > 0) {
      return {
        success: function(cb) {
          if (cb) {
            cb(messages[hash]);
          }
        }
      };
    } else {
      return funcs.getMessages(hash, params);
    }
  };

  funcs.connect = function() {
    if (fetched) {
      connection = new Strophe.Connection(chatToken.ws_address);

      connection.connect(chatToken.username, chatToken.token, function(s) {
        switch(s) {
          case Strophe.Status.CONNECTING:
            console.log('Connecting');
            $rootScope.$broadcast('chat:connecting', connection)
            break;
          case Strophe.Status.CONNFAIL:
            console.log('Connection failed');
            $rootScope.$broadcast('chat:connection-failed', connection)
            break;
          case Strophe.Status.DISCONNECTING:
            console.log('Disconnecting');
            $rootScope.$broadcast('chat:disconnecting', connection)
            break;
          case Strophe.Status.DISCONNECTED:
            console.log('Disconnected');
            $rootScope.$broadcast('chat:disconnected', connection)
            break;
          case Strophe.Status.AUTHFAIL:
            console.log('Authorization failed');
            $rootScope.$broadcast('chat:auth-failed', connection)
            break;
          case Strophe.Status.CONNECTED:
            console.log('Connected');
            connected = true;
            $rootScope.$broadcast('chat:connected', connection);

            connection.addHandler(function(msg) {
              $rootScope.$broadcast('chat:new-message');
              return true;
            }, null, 'message', null, null, null);

            connection.addHandler(function(msg) {
              $rootScope.$broadcast('chat:new-presence');
              return true;
            }, null, 'presence', null, null, null);

            connection.send($pres({type: 'available'}));
            break;
          default:
            break;
        }

        return true;
      }, null, 'message', null, null, null);
    }
  };

  funcs.init = function() {
    $rootScope.$on('chat:token', function(e, token) {
      chatToken = token;

      funcs.get().success(function(val) {
        var promises = [];

        val.items.forEach(function(chat) {
          chat.userData = {};
          chat.us = Auth.user();
          messages[chat.hash] = [];

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
          funcs.connect();
          $rootScope.$broadcast('chat:chats', val.items);
        });
      });
    });

    $rootScope.$on('auth:logged-out', function() {
      chats = null;
      chatToken = null;
      fetched = false;
      connection = null;
      connected = false;
    });
  };

  return funcs;
})

.controller('ChatsCtrl', function($scope, $rootScope, $state, Auth, Chats) {
  $scope.loaded = false;

  $scope.parseChats = function(chats) {
    $scope.user = Auth.user();
    $scope.chats = chats;

    $scope.chats = $scope.chats.sort(function(a, b) {
      x = (new Date(a.modifiedDate)).getTime();
      y = (new Date(b.modifiedDate)).getTime();

      if (x < y) {
        return 1;
      }

      if (x > y) {
        return -1;
      }
    });

    $scope.chats.forEach(function(chat) {
      chat.others = [];
      chat.usernames = [];
      chat.names = [];

      chat.users.forEach(function(user) {
        if (chat.us.id != user) {
          chat.others.push(user);
          chat.usernames.push(chat.userData[user].username);
          chat.names.push(chat.userData[user].firstName + ' ' + chat.userData[user].lastName);
        }
      });

      if (!chat.title) {
        chat.title = chat.names.join(', ');
      }
    });

    $scope.loaded = true;
  };

  $scope.openChat = function(hash) {
    $state.go('tab.chats-detail', {hash: hash});
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
