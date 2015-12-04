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

      var archived = [];
      Chats.get({}, function(convos) {
        convos.items.forEach(function(convo) {
          convo.users.forEach(function(user) {
            var otherId;
            var userId;
            if ($rootScope.chatUsers[user] == undefined) {
              User.get({userId: user}, function(data) {
                $rootScope.chatUsers[user] = data;

                if (user != $rootScope.currentUser.id) {
                  otherId = user;
                  if ($rootScope.chats[user] == undefined) {
                    $rootScope.chats[user] = {user: data, chats: []};
                  } else {
                    $rootScope.chats[user].user = data;
                  }
                } else {
                  userId = data.id;
                }
              });
            }
          });

          Messages.get({conversationId: convo.id}, function(msgs) {
            var otherId;
            var userId;
            if (convo.users[0] != $rootScope.currentUser.id) {
              otherId = convo.users[0];
              userId = convo.users[1];
            } else {
              otherId = convo.users[1];
              userId = convo.users[0];
            }

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
                $rootScope.chats[otherId] = {user: undefined, chats: []};
              }

              $rootScope.chats[otherId].chats.push(m);
              console.log($rootScope.chats);
            });
          });
        });
      });
    });
