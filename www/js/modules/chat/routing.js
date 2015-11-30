angular.module('neo.chat', [])
  .factory('ChatToken', function(Resource) {
    return Resource('/chat/token', {}, {});
  })
  .run(function($rootScope, ChatToken, User) {
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
                m.to = msg.getAttribute('to');
                m.from = msg.getAttribute('from');
                m.type = msg.getAttribute('type');
                m.elems = msg.getElementsByTagName('body');
                m.fromId = m.from.split($rootScope.chatToken.user_prefix)[1].split('@')[0];
                m.toId = m.to.split($rootScope.chatToken.user_prefix)[1].split('@')[0];

                if (m.type == 'chat' && m.elems.length > 0) {
                  var body = m.elems[0];
                  m.text = Strophe.getText(body);
                } else {
                  m.text = undefined;
                }

                if (m.text != undefined) {
                  if ($rootScope.chats[m.fromId] == undefined) {
                    $rootScope.chats[m.fromId] = {chats: [m]};
                  } else {
                    $rootScope.chats[m.fromId].chats.push(m);
                  }
                }

                if ($rootScope.chatUsers[m.fromId] == undefined) {
                  User.get({userId: m.fromId}, function(data) {
                    $rootScope.chatUsers[m.fromId] = m.fromUser = data;
                    $rootScope.chats[m.fromId].user = data;
                  });
                } else {
                  m.fromUser = $rootScope.chatUsers[m.fromId];
                }

                $rootScope.$broadcast('chat:new-chat', m);
                $rootScope.$digest();
                return true;
              }, null, 'message', null, null, null);
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

    $rootScope.$on('chat:connected', function(event, chat) {
      clearTimeout(reconnector);
      wait = 1000;

      pinger = setInterval(function() {
        chat.ping.ping($rootScope.chatToken.username, null, function(val) {
          clearInterval(pinger);
          chat.disconnect();
        }, 5000);
      }, 5000);
    });

    $rootScope.$on('chat:disconnected', function() {
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
    });
  });
