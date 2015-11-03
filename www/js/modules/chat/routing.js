var chat = null;
angular.module('neo.chat', [])
  .factory('ChatToken', function(Resource) {
    return Resource('/chat/token', {}, {});
  })
  .run(function($rootScope, ChatToken) {
    $rootScope.chatToken == null;
    $rootScope.$watch('loggedIn', function(val) {
      if (val) {
        ChatToken.get({}, function(token) {
          $rootScope.chatToken = token;
          var debug = false;

          $rootScope.chatConnection = new Strophe.Connection(token.ws_address);
          chat = $rootScope.chatConnection;

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
                break;
              case Strophe.Status.CONNFAIL:
                console.log('Connection failed');
                break;
              case Strophe.Status.DISCONNECTING:
                console.log('Disconnecting');
                break;
              case Strophe.Status.DISCONNECTED:
                console.log('Disconnected');
                break;
              case Strophe.Status.AUTHFAIL:
                console.log('Authorization failed');
                break;
              case Strophe.Status.CONNECTED:
                console.log('Connected');
                chat.addHandler(function(msg) {
                  var m = {};
                  m.to = msg.getAttribute('to');
                  m.from = msg.getAttribute('from');
                  m.type = msg.getAttribute('type');
                  m.elems = msg.getElementsByTagName('body');

                  if (m.type == 'chat' && m.elems.length > 0) {
                    var body = m.elems[0];
                    m.text = Strophe.getText(body);
                  } else {
                    m.text = undefined;
                  }

                  $rootScope.newChat = m;
                  $rootScope.$digest();
                  return true;
                }, null, 'message', null, null, null);
                chat.send($pres({type: 'available'}));
                break;
              default:
                console.log(s);
                break;
            }
          });
        });
      } else {
        $rootScope.chatToken = null;
      }
    });
  });
