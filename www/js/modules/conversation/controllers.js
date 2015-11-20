angular.module('neo.conversation.controllers', [])

    .controller('ConversationListCtrl', function($scope, $rootScope, Conversations, User, ModalViews) {
      $scope.chats = {};

      $rootScope.$on('chat:connected', function(event, chat) {
        console.log(chat);
      });

      $scope.firstThree = function(chat) {
        return [chat.chats[chat.chats.length-3], chat.chats[chat.chats.length-2], chat.chats[chat.chats.length-1]];
      };

      $scope.clearNewChats = function(chat) {
        $rootScope.newChats -= chat.chats.length;
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
        console.log(val);
        if (val != undefined && val.text != undefined) {
          if ($scope.chats[val.from] == undefined) {
            $scope.chats[val.from] = {chats: [val]};
            $scope.chats[val.from].user = val.fromUser;
          } else {
            $scope.chats[val.from].chats.push(val);
          }

          $rootScope.chats = $scope.chats;
        }
      });
    });
