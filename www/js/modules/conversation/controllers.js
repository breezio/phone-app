angular.module('neo.conversation.controllers', [])

    .controller('ConversationListCtrl', function($scope, Conversations) {

      $scope.doneLoading = false;

      $scope.refresh = function() {
        $scope.start = undefined;
        Conversations.query(function(data) {
          console.log(data);
          $scope.items = data;
          console.log($scope.items);
          $scope.$broadcast('scroll.refreshComplete');
        });
      };

      $scope.items = Conversations.query();
    })
    .controller('ConversationChatCtrl', function($scope, $stateParams, Conversations) {

      $scope.item = Conversations.get({postId: $stateParams.postId});
    })

    ;
