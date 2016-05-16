angular.module('breezio.chats', ['angular-md5', 'breezio.chats.chat', 'breezio.chats.roster'])

.factory('ChatToken', function($http, Config) {
  return {
    get: function() {
      return $http({
        method: 'GET',
        url: Config.url() + '/chat/token'
      });
    }
  };
})

.factory('Chats', function($http, $rootScope, $q, $location, md5, ChatToken, Auth, User, Config) {
  var funcs = {};
  var chatToken = null;
  var chats = {};
  var messages = {};
  var fetched = false;
  var connection = null;
  var connected = false;
  var presence = {};

  funcs.get = function(params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: Config.url() + '/conversations',
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

  funcs.jidToId = function(jid) {
    return jid.split(chatToken.user_prefix)[1].split('@')[0];
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

  funcs.indexOf = function(i) {
    return chats.indexOf(i);
  };

  funcs.toTop = function(chat) {
    var pos = funcs.indexOf(chat);
    if (pos != 0) {
      var el = chats[pos];
      chats.splice(pos, 1);
      chats.splice(0, 0, el);
    }
  };

  funcs.newChat = function(title, creator, users, context) {
    var c = {};

    c.users = [];
    users.forEach(function(user) {
      if (user != Auth.user().id) {
        c.users.push(user);
      }
    });

    c.hash = funcs.generateHash(users, context);
    c.type = "Conversation";
    c.context = context;
    c.title = title;
    c.subtitle = creator.username;

    if (context && context.imagePath) {
      c.imagePath = context.imagePath;
    } else {
      c.imagePath = creator.imagePath;
    }

    if (!funcs.chat(c.hash)) {
      chats = [c].concat(chats);
      messages[c.hash] = [];
    }

    return c.hash;
  };

  funcs.fetched = function() {
    return fetched;
  };

  funcs.connected = function() {
    return connected;
  };

  funcs.connection = function() {
    return connection;
  };

  funcs.presence = function(userId) {
    if (userId) {
      if (presence[userId]) {
        return presence[userId];
      }
    } else {
      return presence;
    }

    return null;
  };

  funcs.unread = function(hash) {
    var chat = funcs.chat(hash);
    if (chat && chat.unread) {
      return chat.unread;
    } else {
      return null;
    }
  };

  funcs.setUnread = function(hash, num) {
    var chat = funcs.chat(hash);
    if (chat) {
      if (!chat.unread) {
        chat.unread = 0;
      }

      chat.unread += 1;
    }
  };

  funcs.incrementUnread = function(hash) {
    funcs.setUnread(hash, funcs.unread(hash) + 1);
  };

  funcs.isOnline = function(userId) {
    if (presence[userId]) {
      if (presence[userId].type == 'available') {
        return true;
      } else if (presence[userId].type == 'unavailable') {
        return false;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  funcs.setMessages = function(hash, list) {
    if (typeof messages[hash] == 'object') {
      messages[hash] = list;
    }
  };

  funcs.addMessage = function(hash, msg) {
    var chat = funcs.chat(hash);
    if (chat && messages[hash]) {
      if (chat.gotten) {
        messages[hash].push(msg);
      }
    }
  };

  funcs.getMessages = function(hash, params) {
    var params = angular.extend({
      limit: 15
    }, params);

    var promise = $http({
      method: 'GET',
      url: Config.url() + '/conversations/' + hash + '/messages',
      params: params
    });

    return promise;
  };

  funcs.messages = function(hash) {
    return messages[hash];
  };

  funcs.postMessage = function(hash, data, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'POST',
      url: Config.url() + '/conversations/' + hash + '/messages',
      params: params,
      data: data
    });

    return promise;
  };

  funcs.parseMessage = function(msg) {
    var m = {};
    m.creationDate = (new Date);
    m.to = msg.getAttribute('to');
    m.from = msg.getAttribute('from');
    m.type = msg.getAttribute('type');
    m.fromId = funcs.jidToId(m.from);
    m.toId = funcs.jidToId(m.to);
    m.userId = m.fromId;
    m.action = 'message';

    var topic = msg.getElementsByTagName('topic')[0];
    if (topic) {
      m.topic = {
        id: topic.getAttribute('id'),
        title: topic.getAttribute('title'),
        slug: topic.getAttribute('slug'),
        postType: topic.getAttribute('posttype'),
        type: topic.getAttribute('type')
      };
    }


    m.hash = funcs.generateHash([m.fromId, m.toId], m.topic);
    var elms = msg.getElementsByTagName('body');
    if (m.type == 'chat' && elms[0]) {
      m.body = Strophe.getText(elms[0]);
    }

    return m;
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
              var m = funcs.parseMessage(msg);

              if (m.body != undefined) {
                $rootScope.$broadcast('chat:new-message', m);
                $rootScope.$broadcast('chat:new-message:' + m.hash, m);
              }

              return true;
            }, null, 'message', null, null, null);

            connection.addHandler(function(msg) {
              var m = {};
              m.from = msg.getAttribute('from');
              m.type = msg.getAttribute('type');
              m.fromId = funcs.jidToId(m.from);

              presence[m.fromId] = m;
              $rootScope.$broadcast('chat:new-presence', m);
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

  funcs.send = function(chat, text) {
    if (funcs.connected()) {
      var other;
      var tripped = false;
      chat.users.forEach(function(id) {
        if (typeof id == 'object') {
          id = id.id;
        }

        if (id != Auth.user().id) {
          other = id;
          tripped = true;
        }
      });
      if (!tripped) {
        other = chat.us.id;
      }

      var m =  {};
      var token = funcs.chatToken();
      var to = token.user_prefix + other + "@" + token.xmpp_host;
      var msg = $msg({
        to: to,
        type: 'chat'
      })
      .cnode(Strophe.xmlElement('body', text)).up()
      .c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});

      if (chat.context && chat.context.id) {
        var topic = {
          id: chat.context.id,
          title: chat.context.title,
          slug: chat.context.slug,
          postType: chat.context.postType,
          type: chat.context.type
        };

        m.topic = topic;
        msg.up().cnode(Strophe.xmlElement('topic', topic)).up();
      }

      m.creationDate = Math.round((new Date).getTime()/1000);
      m.userId = Auth.user().id;
      m.action = 'message';
      m.hash = chat.hash;
      m.body = text;
      m.fromApp = true;

      $rootScope.$broadcast('chat:new-message:' + chat.hash, m);
      funcs.connection().send(msg);

      var data = {
        body: m.body,
        users: chat.users
      };

      if (m.topic) {
        data.topicId = m.topic.id;
        data.contextId = m.topic.id;
        data.contextType = m.topic.type;
      }

      funcs.postMessage(m.hash, data).success(function(ret) {
        m.id = ret.id;
      });
    }
  };

  funcs.init = function() {
    var clearToken = $rootScope.$on('chat:token', function(e, token) {
      chatToken = token;

      funcs.get().success(function(val) {
        var promises = [];

        var ids = [];
        val.items.map(function(chat, index, array) {
          angular.forEach(chat.users, function(user) {
            if (ids.indexOf(user.id) == -1) {
              ids.push(user.id);
            }
          });
        });

        var userData = {};
        var bulkUsers = User.getBulk(ids).then(function(users) {
          angular.forEach(users, function(user, index) {
            userData[user.id] = user;
          });

          angular.forEach(val.items, function(chat) {
            messages[chat.hash] = [];

            var title = [];
            var subtitle = [];
            var selfIndex = null;
            angular.forEach(chat.users, function(user, index) {
              var id = typeof user === 'object' ? user.id : user;

              if (id == Auth.user().id) {
                selfIndex = index;
              } else {
                if (!chat.title) {
                  title.push(userData[id].firstName + ' ' + userData[id].lastName);
                }

                if (!chat.subtitle) {
                  subtitle.push(userData[id].username);
                }
              }
            });

            if (selfIndex != null) {
              chat.users.splice(selfIndex, 1);
            }

            if (!chat.title) {
              chat.title = title.sort().join(', ');
            }

            if (!chat.subtitle) {
              chat.subtitle = subtitle.sort().join(', ');
            }

            if (!chat.imagePath) {
              if (chat.context && chat.context.imagePath) {
                chat.imagePath = chat.context.imagePath;
              } else {
                var id = typeof chat.users[0] === 'object' ? chat.users[0].id : chat.users[0];
                chat.imagePath = userData[id].imagePath;
              }
            }
          });

          chats = val.items;
          fetched = true;
          funcs.connect();
          $rootScope.$broadcast('chat:chats', val.items);

          $rootScope.$on('chat:connected', function() {
            $rootScope.$broadcast('warning:connection', {
              message: 'Connected to chat',
              barClass: 'bar-balanced',
              duration: 2000
            });
          });

          $rootScope.$on('chat:disconnected', function() {
            $rootScope.$broadcast('warning:connection', {
              message: 'Disconnected. Tap to retry',
              barClass: 'bar-assertive'
            });
          });

          $rootScope.$on('app:resume', function() {
            if (!connection || !connection.connected) {
              console.log('Attempting to reconnect');
              funcs.connect();
            }
          });
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

    $rootScope.totalUnread = 0;
    $rootScope.$on('chat:new-message', function(e, msg) {
      var loc = $location.url().split('/');
      loc = loc.slice(-2);

      if (loc[0] == 'chats' && loc[1] == msg.hash) {
      } else {
        funcs.toTop(funcs.chat(msg.hash));
        funcs.incrementUnread(msg.hash);
        $rootScope.totalUnread += 1;
        funcs.addMessage(msg.hash, msg);
        $rootScope.$digest();
      }
    });
  };

  return funcs;
})

.controller('ChatsCtrl', function($scope, $rootScope, $state, $q, Auth, Chats, User) {
  $scope.loaded = false;
  $scope.users = {};
  $scope.unread = Chats.unread;

  $scope.isOnline = Chats.isOnline;

  $scope.loadChats = function(chats) {
    return $q(function(resolve, reject) {
      if (Chats.fetched()) {
        var chats = Chats.chats();
        resolve(chats);
      } else {
        $rootScope.$on('chat:chats', function() {
          var chats = Chats.chats();
          resolve(chats);
        });
      }
    });
  };

  $scope.openChat = function(hash) {
    $state.go('tab.chats-chat', {hash: hash});
  };

  $scope.$on('$ionicView.beforeEnter', function() {
    $rootScope.$on('chat:new-presence', function(e, p) {
      $scope.$digest();
    });

    $scope.loadChats().then(function(chats) {
      $scope.user = Auth.user();

      var promises = [];
      chats.forEach(function(chat) {
        chat.users.forEach(function(user) {
          var id = typeof user === 'object' ? user.id : user;
          var p = User.getCached(id).then(function(res) {
            $scope.users[res.id] = res;
          });

          promises.push(p);
        });
      });

      $q.all(promises).then(function() {
        $scope.chats = chats;
        $scope.loaded = true;
      });
    });
  });

  $rootScope.$on('auth:logged-out', function() {
    $scope.loaded = false;
  });
});
