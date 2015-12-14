angular.module('neo.conversation.services', [])

    .run(function($rootScope, ModalViews, Chats, Messages, User, ConversationHash) {
      ModalViews.register('chat', 'js/modules/conversation/templates/chat.html');

      $rootScope.$on('chat:connected', function() {
        Chats.get({}, function(convos) {
          $rootScope.chatUsers[$rootScope.currentUser.id] = $rootScope.currentUser;
          convos.items.forEach(function(convo) {
            var otherId;
            var userId;
            if (convo.users[0] != $rootScope.currentUser.id) {
              otherId = convo.users[0];
              userId = convo.users[1];
            } else {
              otherId = convo.users[1];
              userId = convo.users[0];
            }

            var currentUser = $rootScope.currentUser;
            var otherUser = User.get({userId: otherId});
            otherUser.$promise.then(function() {
              $rootScope.chatUsers[otherId] = otherUser;

              Messages.get({
                conversationId: convo.id,
                limit: 20,
              }, function(msgs) {
                var lastId = msgs.items[0].id;
                msgs.items.forEach(function(msg) {
                  var m = {};
                  m.text = msg.body;

                  if (msg.userId == otherId) {
                    m.fromId = otherId;
                    m.toId = userId;
                  } else {
                    m.fromId = userId;
                    m.toId = otherId;
                  }

                  m.hash = convo.hash;
                  m.fromUser = $rootScope.chatUsers[m.fromId];

                  if ($rootScope.chats[m.hash] == undefined) {
                    $rootScope.chats[m.hash] = {
                      id: convo.id,
                      hash: convo.hash,
                      lastId: lastId,
                      user: otherUser,
                      chats: [],
                      otherId: otherId,
                      userId: userId,
                    };
                  }

                  $rootScope.chats[m.hash].chats.push(m);
                });
              });
            });
          });
        });
      });
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


      $scope.scroller = $ionicScrollDelegate.$getByHandle('chat-scroll');
      $rootScope.chat = null;

      $scope.newChats = 0;
      $scope.showScroll = false;
      $scope.scrollDown = function() {
        $scope.scroller.scrollBottom(true);
        $scope.showScroll = false;
        $scope.newChats = 0;
      }

      var cleanNewChat = null;
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'chat') {
          $scope.chat = $rootScope.chat;

          if (!$scope.chat.scrollPos) {
            $scope.scroller.scrollBottom(true);
          } else {
            $scope.scroller.scrollTo(0, $scope.chat.scrollPos, false);
          }

          cleanNewChat = $rootScope.$on('chat:new-chat:' + $scope.chat.hash, function(e, m) {
            if (m.text) {
              $scope.scroller.resize();
              $scope.chat.scrollPos = $scope.scroller.getScrollPosition().top;
              $scope.chat.bottom = $scope.scroller.getScrollView().__maxScrollTop;

              if ($scope.chat.bottom - 50 <= $scope.chat.scrollPos) {
                $scope.scroller.scrollBottom(true);
              } else {
                $scope.showScroll = true;
                $scope.newChats += 1;
              }
            }
          });
        }
      });

      $scope.onScroll = function() {
        $scope.chat.scrollPos = $scope.scroller.getScrollPosition().top;
        $scope.chat.bottom = $scope.scroller.getScrollView().__maxScrollTop;
      };

      $scope.$on('modal.hidden', function(e, m) {
        if (m.id == 'chat') {
          $rootScope.chat = undefined;
          $scope.chat = undefined;

          cleanNewChat();
          cleanNewChat = null;
        }
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

          $rootScope.chats[$scope.chat.hash].chats.push(m);
          $scope.text = '';
          $scope.scroller.resize();
          $scope.scroller.scrollBottom(true);
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
