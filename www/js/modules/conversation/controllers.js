angular.module('neo.conversation.controllers', [])

    .controller('ConversationListCtrl', function($scope, $rootScope, Conversations, User) {
      $scope.chats = {};

      $scope.firstThree = function(chat) {
        return chat.chats.slice(chat.chats.length-3, chat.chats.length);
      };

      $scope.clearNewChats = function(chat) {
        $rootScope.newChats -= chat.chats.length;
      };

      $rootScope.$watch('newChat', function(val) {
        if (val != undefined && val.text != undefined) {
          if ($scope.chats[val.from] == undefined) {
            var id = val.from.split($rootScope.chatToken.user_prefix)[1].split('@')[0];
            User.get({userId: id}, function(user) {
              $scope.chats[val.from] = {chats: [val]};
              $scope.chats[val.from].user = user;
            });
          } else {
            $scope.chats[val.from].chats.push(val);
          }

          $rootScope.chats = $scope.chats;
        }
      });
    });
