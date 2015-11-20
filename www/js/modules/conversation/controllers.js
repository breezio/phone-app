angular.module('neo.conversation.controllers', [])

    .controller('ConversationListCtrl', function($scope, $rootScope, Conversations, User, ModalViews) {
      $scope.chats = $rootScope.chats;
      console.log($scope.chats);

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
    });
