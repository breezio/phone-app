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
    .controller('ChatShowCtrl', function($scope, $rootScope, Chats, $ionicScrollDelegate, ModalViews) {
      $scope.showUser = function(id) {
        $rootScope.userId = id;
        ModalViews.get('user').show();
      };

      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'chat') {
          $scope.refresh();
        }
      });

      $scope.$on('modal.hidden', function(e, m) {
        if (m.id == 'chat') {
          $scope.chatData = {};
        }
      });

      $scope.refresh = function() {
        $rootScope.cacheFactory.removeAll();
        Chats.get({conversationId: $rootScope.chatId}, function(chats) {
          $scope.chatData = chats;
          $scope.$broadcast('scroll.refreshComplete');
          $ionicScrollDelegate.resize();
          $ionicScrollDelegate.scrollBottom(true);
        });
      };

      $scope.postComment = function() {
        $scope.refresh()
        $scope.$parent.$$childHead.text = '';
      };
    });
