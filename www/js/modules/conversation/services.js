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
    .controller('ChatCtrl', function($scope, $rootScope, Chats, $ionicScrollDelegate, ModalViews) {
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
    });
