angular.module('neo.chat', [])
  .factory('ChatToken', function(Resource) {
    return Resource('/chat/token', {}, {});
  })
  .factory('Roster', function($http, $q, $rootScope, User, Config) {
    return {
      addToChat: function(id) {
        var addUser = $http({
          url: Config.apiUrl + '/chat/users/' + id,
          method: 'POST',
        })

        var getUser = User.get({userId: id}, function(data) {
          $rootScope.chatUsers[id] = data;
        });

        return $q.all([addUser, getUser]);
      }
    }
  })
  .factory('ConversationHash', function($rootScope, md5) {
    return {
      generateHash: function(users, topic) {
        var currentUserId = $rootScope.currentUser.id;
        if (users.indexOf(currentUserId) == -1) {
          users.push(currentUserId);
        }

        var uniqueKey = users.sort().join(',');
        if (topic && topic.id) {
          uniqueKey = topic.id + ',' + uniqueKey;
        } else if (typeof topic == 'string') {
          uniqueKey = topic + ',' + uniqueKey;
        }

        return md5.createHash(uniqueKey);
      },
      jidToId: function(jid) {
        return jid.split($rootScope.chatToken.user_prefix)[1].split('@')[0];
      }
    }
  })
  .run(function($rootScope, ChatToken, User, ConversationHash) {
    $rootScope.chatToken = null;
    $rootScope.chats = {};
    var connect = function() {
      ChatToken.get({}, function(token) {
        $rootScope.chatToken = token;
        var debug = false;

        $rootScope.chatConnection = new Strophe.Connection(token.ws_address);
        $rootScope.chatUsers = {};

        if (debug) {
          $rootScope.chatConnection.rawInput = function(data) {
            console.log('RECV: ' + data);
          };
          $rootScope.chatConnection.rawOutput = function(data) {
            console.log('SENT: ' + data);
          };
        }

        $rootScope.chatConnection.connect(token.username, token.token, function(s) {
          switch(s) {
            case Strophe.Status.CONNECTING:
              console.log('Connecting');
              $rootScope.$broadcast('chat:connecting', $rootScope.chatConnection)
              $rootScope.$digest();
              break;
            case Strophe.Status.CONNFAIL:
              console.log('Connection failed');
              $rootScope.$broadcast('chat:connection-failed', $rootScope.chatConnection)
              $rootScope.$digest();
              break;
            case Strophe.Status.DISCONNECTING:
              console.log('Disconnecting');
              $rootScope.$broadcast('chat:disconnecting', $rootScope.chatConnection)
              $rootScope.$digest();
              break;
            case Strophe.Status.DISCONNECTED:
              console.log('Disconnected');
              $rootScope.$broadcast('chat:disconnected', $rootScope.chatConnection)
              $rootScope.$digest();
              break;
            case Strophe.Status.AUTHFAIL:
              console.log('Authorization failed');
              $rootScope.$broadcast('chat:auth-failed', $rootScope.chatConnection)
              $rootScope.$digest();
              break;
            case Strophe.Status.CONNECTED:
              console.log('Connected');
              $rootScope.$broadcast('chat:connected', $rootScope.chatConnection)
              $rootScope.$digest();
              $rootScope.chatConnection.addHandler(function(msg) {
                var m = {};
                m.time = (new Date).toTimeString();
                m.to = msg.getAttribute('to');
                m.from = msg.getAttribute('from');
                m.type = msg.getAttribute('type');
                m.elems = msg.getElementsByTagName('body');
                m.fromId = ConversationHash.jidToId(m.from);
                m.toId = ConversationHash.jidToId(m.to);

                var topic = msg.getElementsByTagName('topic')[0];
                if (topic) {
                  m.topic = {
                    id: topic.getAttribute('id'),
                    title: topic.getAttribute('title'),
                    slug: topic.getAttribute('slug'),
                    postType: topic.getAttribute('posttype'),
                    type: topic.getAttribute('type'),
                  };
                }

                m.hash = ConversationHash.generateHash([m.fromId, m.toId], m.topic);

                if (m.type == 'chat' && m.elems.length > 0) {
                  var body = m.elems[0];
                  m.text = Strophe.getText(body);
                } else {
                  m.text = undefined;
                }

                if (m.text != undefined) {
                  if ($rootScope.chats[m.hash] == undefined) {
                    $rootScope.chats[m.hash] = {chats: [m]};
                  } else {
                    $rootScope.chats[m.hash].chats.push(m);
                  }
                }

                if ($rootScope.chatUsers[m.fromId] == undefined) {
                  User.get({userId: m.fromId}, function(data) {
                    $rootScope.chatUsers[m.fromId] = m.fromUser = data;
                    $rootScope.chats[m.hash].user = data;
                  });
                } else {
                  m.fromUser = $rootScope.chatUsers[m.fromId];
                }

                $rootScope.$broadcast('chat:new-chat', m);
                $rootScope.$broadcast('chat:new-chat:' + m.hash, m);
                $rootScope.$digest();
                return true;
              }, null, 'message', null, null, null);

              $rootScope.presence = {};
              $rootScope.chatConnection.addHandler(function(msg) {
                var type = msg.getAttribute('type');
                var from = msg.getAttribute('from');
                var fromId = ConversationHash.jidToId(from);

                if (type && type == 'unavailable') {
                  var online = false;
                } else {
                  var online = true;
                }

                $rootScope.presence[fromId] = online;

                $rootScope.$broadcast('chat:presence', from, status);
                return true;
              }, null, 'presence');

              $rootScope.chatConnection.send($pres({type: 'available'}));
              break;
            default:
              $rootScope.$digest();
              break;
          }
        });
      });
    }

    $rootScope.$on('event:logged-in', function() {
      connect();
    });

    $rootScope.$on('event:logged-out', function() {
      $rootScope.chatConnection.disconnect();
    });

    var wait = 1000;
    var reconnector = null;
    var pinger = null;
    var awayTimer = null;

    $rootScope.$on('chat:connected', function(event, chat) {
      clearTimeout(reconnector);
      wait = 1000;

      $rootScope.roster = {};

      $rootScope.chatConnection.roster.get(function(roster) {
        for (var index in roster) {
          var entry = roster[index];
          entry.id = ConversationHash.jidToId(entry.jid);
          $rootScope.roster[entry.id] = entry;
        }
        $rootScope.$broadcast('chat:on-roster', $rootScope.roster);
      });

      $rootScope.$on('chat:get-roster', function(e) {
        $rootScope.chatConnection.roster.get(function(roster) {
          for (var index in roster) {
            var entry = roster[index];
            entry.id = ConversationHash.jidToId(entry.jid);
            $rootScope.roster[entry.id] = entry;
          }
          $rootScope.$broadcast('chat:on-roster', $rootScope.roster);
        });
      });

      pinger = setInterval(function() {
        chat.ping.ping($rootScope.chatToken.username, null, function(val) {
          clearInterval(pinger);
          chat.disconnect();
        }, 5000);
      }, 5000);

      var setAway = function() {
        $rootScope.chatConnection.send($pres().c('show').t('away'));
        $rootScope.$broadcast('user:away');
      };

      var resetAway = function() {
        $rootScope.chatConnection.send($pres({type: 'available'}));
        $rootScope.$broadcast('user:available');
        clearTimeout(awayTimer);
        awayTimer = setTimeout(setAway, 20000);
      };

      document.ontouchmove = resetAway;
      document.ontouchstart = resetAway;
      document.onmousedown = resetAway;
      document.onkeydown = resetAway;

      resetAway();
    });

    $rootScope.$on('chat:disconnected', function() {
      clearTimeout(awayTimer);
      clearInterval(pinger);
      if ($rootScope.loggedIn) {
        if (wait < 2000) {
          wait = 2000;
        }

        if (wait < 30000) {
          wait = wait * 1.5;
        }

        if (wait > 30000) {
          wait = 30000;
        }

        console.log('Reconnecting in ' + wait);
        reconnector = setTimeout(function() {
          delete $rootScope.chatConnection;
          connect();
        }, wait);
      } else {
        delete $rootScope.chatConnection;
      }

      document.ontouchmove = null;
      document.ontouchstart = null;
      document.onmousedown = null;
      document.onkeydown = null;
    });

  });
