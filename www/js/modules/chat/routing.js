var chat = null;
angular.module('neo.chat', [])
  .factory('ChatToken', function(Resource) {
    return Resource('/chat/token', {}, {});
  })
  .run(function($rootScope, ChatToken, User) {
    var connecting = false;
    var connected = false;

    $rootScope.chatToken == null;
    var connect = function() {
      ChatToken.get({}, function(token) {
        $rootScope.chatToken = token;
        var debug = false;

        $rootScope.chatConnection = new Strophe.Connection(token.ws_address);
        chat = $rootScope.chatConnection;
        $rootScope.chatUsers = {};

        if (debug) {
          chat.rawInput = function(data) {
            console.log('RECV: ' + data);
          };
          chat.rawOutput = function(data) {
            console.log('SENT: ' + data);
          };
        }

        $rootScope.chatConnection.connect(token.username, token.token, function(s) {
          switch(s) {
            case Strophe.Status.CONNECTING:
              console.log('Connecting');
              $rootScope.$digest();
              break;
            case Strophe.Status.CONNFAIL:
              console.log('Connection failed');
              connecting = false;
              connected = false;
              $rootScope.$digest();
              break;
            case Strophe.Status.DISCONNECTING:
              console.log('Disconnecting');
              $rootScope.$digest();
              break;
            case Strophe.Status.DISCONNECTED:
              console.log('Disconnected');
              connecting = false;
              connected = false;
              $rootScope.$digest();
              break;
            case Strophe.Status.AUTHFAIL:
              console.log('Authorization failed');
              connecting = false;
              connected = false;
              $rootScope.$digest();
              break;
            case Strophe.Status.CONNECTED:
              console.log('Connected');
              connecting = false;
              connected = true;
              chat.addHandler(function(msg) {
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

                if ($rootScope.chatUsers[m.fromId] == undefined) {
                  User.get({userId: m.fromId}, function(data) {
                    $rootScope.chatUsers[m.fromId] = m.fromUser = data;
                  });
                } else {
                  m.fromUser = $rootScope.chatUsers[m.fromId];
                }

                $rootScope.newChat = m;
                $rootScope.$digest();
                return true;
              }, null, 'message', null, null, null);
              chat.send($pres({type: 'available'}));
              $rootScope.$digest();
              break;
            default:
              console.log(s);
              $rootScope.$digest();
              break;
          }
        });
      });
    }

    $rootScope.$watch('loggedIn', function(val) {
      if (val) {
        if (!connecting && !connected) {
          connect();
        }
      } else {
        $rootScope.chatToken = null;
      }
    });

    setInterval(function() {
      if ($rootScope.chatToken != undefined && !connected && !connecting) {
        console.log('Attempting to connect');
        connect();
      }
    }, 2000);
  });
