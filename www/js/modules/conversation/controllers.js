angular.module('neo.conversation.controllers', [])

    .controller('ConversationListCtrl', function($scope, Conversations) {

      $scope.items = Conversations.query({limit: 10});
    })
    .controller('ConversationShowCtrl', function($scope, $stateParams, Conversations) {

      $scope.item = Conversations.get({postId: $stateParams.postId});
    })

    ;
