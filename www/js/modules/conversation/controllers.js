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

      Chats.get({}, function(data) {
        data.items.forEach(function(convo) {
          if (!convo.deleted) {
            var fromId;
            var toId;
            convo.users.forEach(function(user) {
              if (user != $rootScope.currentUser.id) {
                fromId = user;
                if ($rootScope.chats[user] == undefined) {
                  $rootScope.chats[user] = {chats: []};
                }
              } else {
                toId = user;
              }

              if ($rootScope.chatUsers[fromId] == undefined) {
                User.get({userId: fromId}, function(data) {
                  $rootScope.chatUsers[fromId] = data;
                  $rootScope.chats[fromId].user = data;
                });
              }
            });

            Messages.get({conversationId: convo.id}, function(data) {
              data.items.forEach(function(item) {
                var m = {};

                if (item.userId == fromId) {
                  m.fromId = fromId;
                  m.toId = toId;
                } else {
                  m.fromId = toId;
                  m.toId = fromId;
                }

                m.text = item.body;
                m.fromUser = $rootScope.chatUsers[m.fromId];

                $rootScope.chats[fromId].chats.push(m);
              });
            });

            console.log($rootScope.chats);
          }
        });
      });
    });
