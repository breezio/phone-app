angular.module('breezio.chats.detail', [])

.directive('breezioMessages', function(User, $ionicScrollDelegate, $rootScope, $timeout) {
  return {
    templateUrl: 'templates/breezio-messages.html',
    link: function(scope, element, attrs) {
      if (attrs.type == 'chat') {
        scope.text = '';
        scope.$watch('messages', function(messages) {

          scope.send = function() {
            $rootScope.$broadcast('messages:send', scope.text);
            scope.text = ''; 
          };

        });
      }
    }
  };
})

.controller('ChatsDetailCtrl', function($scope, $rootScope, $stateParams, User, Auth, Chats, $ionicScrollDelegate, $timeout) {

  $scope.formatLine = function(lines, index) {
    var line = lines[index];
    var username;
    var text = '';
    if (line.userId == $scope.chat.us.id) {
      username = $scope.chat.us.username;
    } else {
      username = $scope.chat.userData[line.userId].username;
    }

    if (lines[index-1]) {
      var diff = line.creationDate - lines[index-1].creationDate;
      if (diff > 180) {
        text += '<p class="timestamp"><strong>' + (new Date(line.creationDate * 1000)).toString() + '</strong></p>';
      }
    }

    text += '<strong>' + username + '</strong> ' + line.body;
    return text;
  };

  var recieveHandler = $rootScope.$on('chat:new-message:' + $stateParams.hash, function(e, msg) {
    $scope.messages.push(msg);

    $ionicScrollDelegate.$getByHandle('chatScroll').resize();
    var max = $ionicScrollDelegate.$getByHandle('chatScroll').getScrollView().__maxScrollTop;
    var pos = $ionicScrollDelegate.$getByHandle('chatScroll').getScrollPosition().top;

    if (max - pos <= 50) {
      $scope.scrollDown();
    } else {
      if (!$scope.chat.newChats) {
        $scope.chat.newChats = 0;
      }

      $scope.chat.newChats += 1;
      $scope.chat.showScroll = true;
    }

    try {
      $scope.$digest();
    } catch (e) {}
  });

  var sendHandler = $rootScope.$on('messages:send', function(e, text) {
    Chats.send($scope.chat, text);
    $scope.scrollDown();
  });

  $scope.scrollDown = function() {
    $ionicScrollDelegate.$getByHandle('chatScroll').scrollBottom(true);
    $scope.chat.showScroll = false;
    $scope.chat.newChats = 0;
  };

  var load = function() {
    var other;
    for (var i in $scope.chat.users) {
      if ($scope.chat.users[i] != $scope.chat.us.id) {
        other = i;
        break;
      }
    }

    $scope.chat.other = $scope.chat.userData[$scope.chat.users[i]];

    var msgs = Chats.messages($scope.chat.hash);
    if (msgs.length < 1 && !$scope.chat.exhausted) {
      Chats.getMessages($scope.chat.hash).success(function(res) {
        $scope.messages = res.items;
        if (res.items.length < 1) {
          $scope.chat.exhausted = true;
        } else {
          $scope.chat.lastId = res.items[0].id;
        }
      });
    } else {
      $scope.messages = msgs;
    }
  };

  $scope.$watch('messages', function(val) {
    if (val) {
      if (!$scope.chat.scrolled) {
        $scope.chat.scrolled = true;
        $scope.scrollDown();
      } else {
        $ionicScrollDelegate.$getByHandle('chatScroll').scrollTo(0, $scope.chat.scrollPos, true);
      }
    }
  });

  $rootScope.$on('chat:offscreen-update', function() {
    $scope.scrollDown();
  });

  $scope.loadMore = function() {
    if ($scope.chat.lastId && !$scope.chat.exhausted) {
      var p = Chats.getMessages($stateParams.hash, {lastId: $scope.chat.lastId});
      p.success(function(res) {
        if (res.items.length < 1) {
          $scope.chat.exhausted = true;
        } else {
          $scope.chat.lastId = res.items[0].id;
          $scope.messages = res.items.concat($scope.messages);
        }
        $scope.chat.scrollPos = $ionicScrollDelegate.$getByHandle('chatScroll').getScrollPosition().top;
        $scope.$broadcast('scroll.refreshComplete');
      });
    } else {
      $scope.$broadcast('scroll.refreshComplete');
    }
  };

  $scope.$on('$ionicView.beforeLeave', function() {
    recieveHandler();
    sendHandler();

    var pos = $ionicScrollDelegate.$getByHandle('chatScroll').getScrollPosition();
    if (typeof pos == 'object') {
      $scope.chat.scrollPos = pos.top;
    }

    Chats.setMessages($stateParams.hash, $scope.messages);
  });

  $scope.$on('$ionicView.loaded', function() {
    if (Chats.fetched()) {
      $scope.chat = Chats.chat($stateParams.hash);
      load();
    } else {
      clean = $rootScope.$on('chat:chats', function() {
        $scope.chat = Chats.chat($stateParams.hash);
        load();
      });
    }
  });
});
