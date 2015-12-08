angular.module('neo.conversation.services', [])

    .run(function($rootScope, ModalViews) {
      ModalViews.register('chat', 'js/modules/conversation/templates/chat.html');
    })
    .factory('Chats', function(Resource) {
      return Resource('/conversations/:conversationId');
    })
    .factory('Messages', function(Resource) {
      var actions = {
        post: {
          url: '/conversations/:conversationId/messages/',
          method: 'POST',
        },
      };

      return Resource('/conversations/:conversationId/messages/', {}, actions);
    })
    .controller('ChatCtrl', function($scope, $rootScope, Chats, Messages, $ionicScrollDelegate, ModalViews, User) {

      $rootScope.chat = null;
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'chat') {
          $scope.chat = $rootScope.chat;
          console.log($scope.chat);
        }

        $ionicScrollDelegate.scrollBottom(true);
      });

      $scope.$on('modal.hidden', function(e, m) {
        if (m.id == 'chat') {
          $scope.chat = undefined;
        }
      });

      var oldVal = null;
      $scope.$watch('chat.chats.length', function(val) {
        if (oldVal == null || oldVal + 1 == val) {
          $ionicScrollDelegate.scrollBottom(true);
        } else if (val > oldVal + 1)  {
          $ionicScrollDelegate.scrollTop(true);
        }
        oldVal = val;
      });

      $scope.loadMore = function() {
        Messages.get({
          conversationId: $scope.chat.id,
          limit: 20,
          lastId: $scope.chat.lastId,
        }, function(data) {
          var newData = [];
          data.items.forEach(function(msg) {
            var m = {};
            m.text = msg.body;

            if (msg.userId == $scope.chat.otherId) {
              m.fromId = $scope.chat.otherId;
              m.toId = $scope.chat.userId;
            } else {
              m.fromId = $scope.chat.userId;
              m.toId = $scope.chat.otherId;
            }

            m.fromUser = $rootScope.chatUsers[m.fromId];

            newData.push(m);
          });

          $scope.chat.chats = newData.concat($scope.chat.chats);
          $scope.chat.lastId = data.items[0].id;

          $scope.$broadcast('scroll.refreshComplete');
        }, function() {
          $scope.$broadcast('scroll.refreshComplete');
        });
      };

      $scope.send = function() {
        if ($scope.text != undefined && $scope.text != '') {

          var to = $rootScope.chatToken.user_prefix + $scope.chat.user.id + "@" + $rootScope.chatToken.xmpp_host;
          var msg = $msg({
            to: to,
            type: 'chat'
          })
          .cnode(Strophe.xmlElement('body', $scope.text)).up()
          .c('active', {xmlns: 'http://jabber.org/protocol/chatstates'});

          $rootScope.chatConnection.send(msg);

          Messages.post({conversationId: $scope.chat.id}, {
            body: $scope.text,
            users: [$scope.chat.user.id],
          }, function(test) {
          });

          var m = {};
          m.to = to;
          m.from = $rootScope.chatToken.username;
          m.type = 'chat';
          m.fromId = m.from.split($rootScope.chatToken.user_prefix)[1].split('@')[0];
          m.toId = m.to.split($rootScope.chatToken.user_prefix)[1].split('@')[0];
          m.text = $scope.text;

          if ($rootScope.chatUsers[m.fromId] == undefined) {
            User.get({userId: m.fromId}, function(data) {
              $rootScope.chatUsers[m.fromId] = m.fromUser = data;
            });
          } else {
            m.fromUser = $rootScope.chatUsers[m.fromId];
          }

          $rootScope.chats[$scope.chat.user.id].chats.push(m);
          $scope.text = '';
        }

        setTimeout(function() {
          var chatInput = document.getElementById('chatInput');
          chatInput.focus();
        }, 50);
      };

      $scope.formatLine = function(line) {
        if (line == undefined || line.fromUser == undefined) {
          return "";
        } else {
          return "<strong>" + line.fromUser.username + "</strong> " + line.text;
        }
      };
    });
