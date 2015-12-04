angular.module('neo.conversation.services', [])

    .run(function($rootScope, ModalViews) {
      ModalViews.register('chat', 'js/modules/conversation/templates/chat.html');
    })
    .factory('Chats', function(Resource) {
      return Resource('/conversations/:conversationId');
    })
    .factory('Messages', function(Resource) {
      return Resource('/conversations/:conversationId/messages/:messageLimit');
    })
    .controller('ChatCtrl', function($scope, $rootScope, Chats, $ionicScrollDelegate, ModalViews, User) {

      $rootScope.chat = null;
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'chat') {
          $scope.chat = $rootScope.chat;
        }
      });

      $scope.$on('modal.hidden', function(e, m) {
        if (m.id == 'chat') {
          $scope.chat = undefined;
        }
      });

      $scope.send = function() {
        if ($scope.text != undefined && $scope.text != '') {
          var to = $rootScope.chatToken.user_prefix + $scope.chat.user.id + "@" + $rootScope.chatToken.xmpp_host;
          var msg = $msg({
            to: to,
            type: 'chat'
          })
          .cnode(Strophe.xmlElement('body', $scope.text)).up()
          .c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});

          $rootScope.chatConnection.send(msg);

          var m = {};
          m.to = to;
          m.from = $rootScope.chatToken.username;
          m.type = 'chat';
          m.fromId = m.from.split($rootScope.chatToken.user_prefix)[1].split('@')[0];
          m.toId = m.to.split($rootScope.chatToken.user_prefix)[1].split('@')[0];
          m.text = $scope.text;

          if ($rootScope.chatUsers[m.fromId] == undefined) {
            User.get({userId: m.fromId}, function(data) {
              $rootScope.chatUsers[m.fromId] = m.fromUser = data;
            });
          } else {
            m.fromUser = $rootScope.chatUsers[m.fromId];
          }

          $rootScope.chats[$scope.chat.user.id].chats.push(m);
          $scope.text = '';
        }

        setTimeout(function() {
          var chatInput = document.getElementById('chatInput');
          console.log(chatInput);
          chatInput.focus();
        }, 50);
      };

      $scope.formatLine = function(line) {
        if (line == undefined || line.fromUser == undefined) {
          return "";
        } else {
          return "<strong>" + line.fromUser.username + "</strong> " + line.text;
        }
      };
    });
