angular.module('neo.message.controllers', [])

    .controller('MessageListCtrl', function ($scope, Messages) {

		$scope.items = Messages.query({limit: 10});
    })
    .controller('MessageShowCtrl', function ($scope, $stateParams, Messages) {

		$scope.item = Messages.get({postId: $stateParams.postId});
    })

    ;