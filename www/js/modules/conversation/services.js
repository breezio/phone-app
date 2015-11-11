angular.module('neo.conversation.services', [])

    .run(function($rootScope, ModalViews) {
      ModalViews.register('chat', 'js/modules/conversation/templates/chat.html');
    })
    .factory('Conversations', function(Resource) {
      return Resource('/conversations/:conversationId');
    })
    .factory('Chats', function(Resource) {
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
          var msg = $msg({
            to: $scope.chat.chats[0].from,
            type: 'chat'
          })
          .cnode(Strophe.xmlElement('body', $scope.text)).up()
          .c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});

          $rootScope.chatConnection.send(msg);

          var m = {};
          m.to = $scope.chat.chats[0].from;
          m.from = $scope.chat.chats[0].to;
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

          $rootScope.chats[$scope.chat.chats[0].from].chats.push(m);
          $scope.text = '';
        }
      };

      $scope.formatLine = function(line) {
        if (line == undefined || line.fromUser == undefined) {
          return "";
        } else {
          return "<strong>" + line.fromUser.username + "</strong> " + line.text;
        }
      };
    });
