angular.module('breezio.chats.detail', [])

.directive('breezioMessages', function(User, $ionicScrollDelegate) {
  return {
    templateUrl: 'templates/breezio-messages.html',
    link: function(scope, element, attrs) {
      if (attrs.type == 'chat') {
        scope.text = '';
        scope.$watch('messages', function(messages) {
          scope.formatLine = function(line) {
            var username;
            if (line.userId == scope.chat.us.id) {
              username = scope.chat.us.username;
            } else {
              username = scope.chat.userData[line.userId].username;
            }

            return '<strong>' + username + '</strong> ' + line.body;
          };

          scope.send = function() {
            scope.text = ''; 
          };

        });
      }
    }
  };
})

.controller('ChatsDetailCtrl', function($scope, $rootScope, $stateParams, User, Auth, Chats, $ionicScrollDelegate, $timeout) {
  $scope.loaded = false;
  var clean = null;
  var getMessages = function() {
    Chats.messages($stateParams.hash).success(function(msgs) {
      if (msgs.items.length > 0) {
        $scope.messages = msgs.items;
        $scope.chat.lastId = msgs.items[0].id;
        $scope.chat.exhausted = false;
      } else {
        $scope.chat.exhausted = false;
      }

      $scope.loaded = true;
      $ionicScrollDelegate.scrollBottom(true);
    });
  };

  $scope.$on('$ionicView.beforeEnter', function() {
    if (Chats.fetched()) {
      $scope.chat = Chats.chat($stateParams.hash);
      getMessages();
    } else {
      clean = $rootScope.$on('chat:chats', function() {
        $scope.chat = Chats.chat($stateParams.hash);
        getMessages();
      });
    }
  });

  $scope.loadMore = function() {
    if ($scope.chat.lastId && !$scope.chat.exhausted) {
      var p = Chats.getMessages($stateParams.hash, {lastId: $scope.chat.lastId});
      p.success(function(ret) {
        if (ret.items.length > 0) {
          $scope.chat.lastId = ret.items[0].id;
          $scope.messages = ret.items.concat($scope.messages);
        } else {
          $scope.chat.exhausted = true;
        }
        $scope.$broadcast('scroll.refreshComplete');
      }).error(function() {
        $scope.$broadcast('scroll.refreshComplete');
        $scope.chat.exhuasted = true;
      });
    } else {
      $scope.$broadcast('scroll.refreshComplete');
    }
  };
  
  $scope.$on('$ionicView.afterLeave', function() {
    if (typeof clean == 'function') {
      $scope.loaded = false;
      clean(); 
    }
  });
});
