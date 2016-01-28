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
                  m.time = new Date(msg.creationDate).toTimeString();

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
                    if (convo.title == null) {
                      convo.title = otherUser.firstName + ' ' + otherUser.lastName + ' (' + otherUser.username + ')';
                    }

                    $rootScope.chats[m.hash] = {
                      id: convo.id,
                      hash: m.hash,
                      title: convo.title,
                      lastId: lastId,
                      user: otherUser,
                      chats: [],
                      otherId: otherId,
                      userId: userId,
                      context: convo.context,
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
    .controller('ChatCtrl', function($scope, $rootScope, Chats, Messages, $ionicScrollDelegate, ModalViews, User, ConversationHash) {


      $scope.scroller = $ionicScrollDelegate.$getByHandle('chat-scroll');
      $rootScope.chat = null;

      var cleanNewChat = null;
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'chat') {
          $scope.chat = $rootScope.chat;
          if (!$scope.chat) {
            console.error('$scope.chat could not be populated');
            return;
          }

          if (!$scope.chat || !$scope.chat.scrollPos) {
            $scope.scroller.scrollBottom(true);
          } else {
            $scope.scroller.scrollTo(0, $scope.chat.scrollPos, false);
          }

          $scope.chat.newChats = $scope.chat.newChats || 0;
          $scope.chat.showScroll = $scope.chat.showScroll || false;

          $scope.scrollDown = function() {
            $scope.scroller.scrollBottom(true);
            $scope.chat.showScroll = false;
            $scope.chat.newChats = 0;
          }

          cleanNewChat = $rootScope.$on('chat:new-chat:' + $scope.chat.hash, function(e, m) {
            if (m.text) {
              $scope.scroller.resize();
              $scope.chat.scrollPos = $scope.scroller.getScrollPosition().top;
              $scope.chat.bottom = $scope.scroller.getScrollView().__maxScrollTop;

              if ($scope.chat.bottom - 50 <= $scope.chat.scrollPos) {
                $scope.scroller.scrollBottom(true);
              } else {
                $scope.chat.showScroll = true;
                $scope.chat.newChats += 1;
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

					if ($scope.chat.context && $scope.chat.context.id) {
            var topic = {
              id: $scope.chat.context.id,
              title: $scope.chat.context.title,
              slug: $scope.chat.context.slug,
              postType: $scope.chat.context.postType,
              type: $scope.chat.context.type,
            };

						msg.up().cnode(Strophe.xmlElement('topic', topic)).up()
					}

          $rootScope.chatConnection.send(msg);

          var m = {};
          m.time = new Date().toTimeString();
          m.to = to;
          m.from = $rootScope.chatToken.username;
          m.type = 'chat';
          m.fromId = ConversationHash.jidToId(m.from);
          m.toId = ConversationHash.jidToId(m.to);
          m.text = $scope.text;
          m.hash = ConversationHash.generateHash([m.fromId, m.toId], $scope.chat.context);

          Messages.post({conversationId: m.hash}, {
            body: $scope.text,
            users: [$scope.chat.user.id, $rootScope.currentUser.id],
          }, function(test) {
          });

          if ($rootScope.chatUsers[m.fromId] == undefined) {
            User.get({userId: m.fromId}, function(data) {
              $rootScope.chatUsers[m.fromId] = m.fromUser = data;
            });
          } else {
            m.fromUser = $rootScope.chatUsers[m.fromId];
          }

          $rootScope.chats[m.hash].chats.push(m);
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
        } else if (line.time == undefined) {
          return "<strong>" + line.fromUser.username + "</strong> " + line.text;
        } else {
          return "<strong>" + line.time + " " + line.fromUser.username + "</strong> " + line.text;
        }
      };
    });
