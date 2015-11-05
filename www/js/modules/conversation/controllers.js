angular.module('neo.conversation.controllers', [])

    .controller('ConversationListCtrl', function($scope, $rootScope, Conversations, User) {
      $scope.chats = {};

      $scope.firstThree = function(chat) {
        return chat.chats.slice(chat.chats.length-3, chat.chats.length);
      };

      $scope.clearNewChats = function(chat) {
        $rootScope.newChats -= chat.chats.length;
      };

      $scope.formatLine = function(line) {
        if (line.fromUser == undefined) {
          return "";
        } else {
          return "<strong>" + line.fromUser.username + "</strong> " + line.text;
        }
      };

      $rootScope.$watch('newChat', function(val) {
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
