angular.module('breezio.chats.detail', [])

.directive('breezioMessages', function(User, $ionicScrollDelegate, $rootScope) {
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
            $rootScope.$broadcast('messages:send', scope.text);
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

  var tmp1 = $rootScope.$on('chat:new-message:' + $stateParams.hash, function(e, msg) {
    $scope.messages.push(msg);
    $ionicScrollDelegate.scrollBottom(true);

    try {
      $scope.$digest();
    } catch (e) {}
  });

  var tmp2 = $rootScope.$on('messages:send', function(e, text) {
    if (Chats.connected()) {
      var other;
      var tripped = false;
      $scope.chat.users.forEach(function(id) {
        if (id != $scope.chat.us.id) {
          other = id;
          tripped = true;
        }
      });
      if (!tripped) {
        other = $scope.chat.us.id;
      }

      var m =  {};
      var token = Chats.chatToken();
      var to = token.user_prefix + other + "@" + token.xmpp_host;
      var msg = $msg({
        to: to,
        type: 'chat'
      })
      .cnode(Strophe.xmlElement('body', text)).up()
      .c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});

      if ($scope.chat.context && $scope.chat.context.id) {
        var topic = {
          id: $scope.chat.context.id,
          title: $scope.chat.context.title,
          slug: $scope.chat.context.slug,
          postType: $scope.chat.context.postType,
          type: $scope.chat.context.type
        };

        m.topic = topic;
        msg.up().cnode(Strophe.xmlElement('topic', topic)).up();
      }

      m.creationDate = (new Date);
      m.userId = Auth.user().id;
      m.action = 'message';
      m.hash = $stateParams.hash;
      m.body = text;

      $rootScope.$broadcast('chat:new-message:' + $stateParams.hash, m);

      Chats.connection().send(msg);
    }
  });

  $scope.$on('$ionicView.beforeLeave', function() {
    tmp1();
    tmp2();
  });

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
