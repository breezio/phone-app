angular.module('neo.conversation.services', [])

    .run(function($rootScope, $ionicModal) {
      $ionicModal.fromTemplateUrl('js/modules/conversation/templates/chat.html', {
        animation: 'slide-in-up',
      }).then(function(modal) {
        $rootScope.chatModal = modal;
      });

      $rootScope.showChat = function(data) {
        $rootScope.chatData = data;
        $rootScope.chatModal.show();
      };
    })
    .controller('ChatShowCtrl', function($scope, $rootScope, Conversations) {

    })
    .factory('Conversations', function(Resource) {
      return Resource('/conversations/:conversationId');
    });
