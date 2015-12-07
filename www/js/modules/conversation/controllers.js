angular.module('neo.conversation.controllers', [])

    .controller('ConversationListCtrl', function($scope, $rootScope, Chats, Messages, User, ModalViews) {
      $scope.chats = $rootScope.chats;

      $scope.firstThree = function(chat) {
        return [chat.chats[chat.chats.length-3], chat.chats[chat.chats.length-2], chat.chats[chat.chats.length-1]];
      };

      $scope.showChat = function(chat) {
        $rootScope.chat = chat;
        ModalViews.get('chat').show();
      };

      $scope.formatLine = function(line) {
        if (line == undefined || line.fromUser == undefined) {
          return "";
        } else {
          return "<strong>" + line.fromUser.username + "</strong> " + line.text;
        }
      };

      $rootScope.$on('chat:new-chat', function(event, val) {
      });

      if (!$rootScope.chatUsers) {
        $rootScope.chatUsers = {};
      }

      var chatList = Chats.get({}, function(convos) {
        $rootScope.chatUsers[$rootScope.currentUser.id] = $rootScope.currentUser;
        convos.items.forEach(function(convo) {
          var otherId;
          var userId;
          if (convo.users[0] != $rootScope.currentUser.id) {
            otherId = convo.users[0];
            userId = convo.users[1];
          } else {
            otherId = convo.users[1];
            userId = convo.users[0];
          }

          var currentUser = $rootScope.currentUser;
          var otherUser = User.get({userId: otherId});
          otherUser.$promise.then(function() {
            $rootScope.chatUsers[otherId] = otherUser;

            Messages.get({conversationId: convo.id}, function(msgs) {
              msgs.items.forEach(function(msg) {
                var m = {};
                m.text = msg.body;

                if (msg.userId == otherId) {
                  m.fromId = otherId;
                  m.toId = userId;
                } else {
                  m.fromId = userId;
                  m.toId = otherId;
                }

                m.fromUser = $rootScope.chatUsers[m.fromId];

                if ($rootScope.chats[otherId] == undefined) {
                  $rootScope.chats[otherId] = {id: convo.id, user: otherUser, chats: []};
                }

                $rootScope.chats[otherId].chats.push(m);
              });
            });
          });
        });
      });
    });
