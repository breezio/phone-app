angular.module('breezio.chats.chat', [])

.controller('ChatCtrl', function($scope, $rootScope, $stateParams, $timeout, $ionicHistory, $ionicScrollDelegate, $ionicNativeTransitions, $ionicTabsDelegate, $q, User, Auth, Chats) {

  $scope.users = {};
  $scope.msgsLoaded = false;
  $scope.chatLoaded = false;
  $scope.text = '';
  $scope.input = document.getElementById('chatInput');

  $scope.chat = {};

  $scope.unread = Chats.unread;

  $scope.goBack = function() {
    var view = $ionicHistory.backView();
    $ionicNativeTransitions.stateGo(view.stateId, view.stateParams, {
      type: 'slide',
      direction: 'right'
    });
  };

  $scope.$watch('messages', function(val, old) {
    if (val && val.length && !$scope.more) {
      if ($scope.chat && !$scope.chat.gotten) {
        $ionicScrollDelegate.$getByHandle('chat-scroll').scrollBottom(false);
        $scope.chat.gotten = true;
      } else if ($scope.chat && $scope.chat.pos) {
        $ionicScrollDelegate.$getByHandle('chat-scroll').scrollTo(0, $scope.chat.pos, false);
      }
    } else if ($scope.more) {
      delete $scope.more;
    }
  });

  $scope.formatLine = function(lines, index) {
    var line = lines[index];
    var text = '';
    var username;
    var us = Auth.user();

    if (line.userId == us.id) {
      username = us.username;
    } else {
      username = $scope.users[line.userId].username;
    }

    text += '<strong>' + username + '</strong> ' + line.body;

    return text;
  };

  $scope.scrollDown = function(chat) {
    if (chat.unread) {
      $rootScope.totalUnread -= $scope.chat.unread;
      delete chat.unread
    }

    $ionicScrollDelegate.scrollBottom(true);
  };

  $scope.atBottom = function() {
    var height = $ionicScrollDelegate.$getByHandle('chat-scroll').getScrollView().__maxScrollTop;
    var top = $ionicScrollDelegate.$getByHandle('chat-scroll').getScrollPosition().top;

    if (height - top <= 50) {
      return true;
    }

    return false;
  };

  $scope.checkScroll = function() {
    $scope.chat.atBottom = $scope.atBottom();
    if ($scope.chat.unread && $scope.chat.atBottom) {
      $rootScope.totalUnread -= $scope.chat.unread;
      $rootScope.$digest();
      delete $scope.chat.unread;
      $scope.$digest();
    }
  };

  $scope.loadMore = function() {
    if ($scope.chat.exhausted) {
      $scope.$broadcast('scroll.refreshComplete');
      $ionicScrollDelegate.resize();
    } else {
      var p = Chats.getMessages($scope.chat.hash, {lastId: $scope.chat.lastId});
      p.success(function(res) {
        if (res.items.length < 1) {
          $scope.chat.exhausted = true;
        } else {
          $scope.more = true;
          $scope.messages = res.items.concat($scope.messages);
          $scope.chat.lastId = res.items[0].id;
        }
      }).catch(function() {
        console.log('Load error');
      }).finally(function() {
        $scope.$broadcast('scroll.refreshComplete');
        $ionicScrollDelegate.resize();
      });
    }
  };

  $scope.send = function() {
    if ($scope.msgsLoaded && Chats.connected() && $scope.text != '') {
      Chats.send($scope.chat, $scope.text);
      $scope.text = '';

      var pos = Chats.indexOf($scope.chat);
      if (pos != 0) {
        Chats.toTop(pos);
      }

      $timeout(function() {
        $scope.input.focus();
        if (window.cordova) {
          cordova.plugins.Keyboard.show();
        }
      }, 20);
    }
  };

  var tabElements;
  $scope.keyboardShow = function() {
    $ionicTabsDelegate.showBar(false);
    tabElements = angular.element(document.querySelectorAll('.has-tabs'));
    tabElements.addClass('hidden-tabs');
    $ionicScrollDelegate.scrollBottom(true);
  };

  $scope.keyboardHide = function() {
    $ionicTabsDelegate.showBar(true);
    tabElements.removeClass('hidden-tabs');
    $ionicScrollDelegate.scrollBottom(true);
    $scope.$apply();
  };

  $scope.loadMessages = function(hash) {
    return $q(function(resolve, reject) {
      var msgs = Chats.messages(hash);
      if (msgs && msgs.length < 1 && !$scope.chat.exhausted) {
        var p = Chats.getMessages(hash).success(function(res) {
          if (res.items.length < 1) {
            $scope.chat.exhausted = true;
          } else {
            $scope.chat.lastId = res.items[0].id;
          }

          resolve(res.items);
        }).catch(function(err) {
          reject(err);
        });
      } else {
        resolve(msgs);
      }
    });
  };

  $scope.loadChat = function() {
    return $q(function(resolve, reject) {
      if (Chats.fetched()) {
        var chat = Chats.chat($stateParams.hash);
        if (chat) {
          resolve(chat);
        } else {
          reject(chat);
        }
      } else {
        $rootScope.$on('chat:chats', function() {
          var chat = Chats.chat($stateParams.hash);
          if (chat) {
            resolve(chat);
          } else {
            reject(chat);
          }
        });
      }
    });
  };

  $scope.$on('$ionicView.beforeLeave', function() {
    $rootScope.$ionicGoBack = $scope.oldBack;
    window.removeEventListener('native.keyboardshow', $scope.keyboardShow);
    window.removeEventListener('native.keyboardhide', $scope.keyboardHide);

    var pos = $ionicScrollDelegate.$getByHandle('chat-scroll').getScrollPosition();
    if (pos) {
      $scope.chat.pos = pos.top;
    } else {
      delete pos;
    }

    if ($scope.chat) {
      if (Chats.messages($scope.chat.hash) != $scope.messages) {
        Chats.setMessages($scope.chat.hash, $scope.messages);
      }

      if (typeof $scope.recieveHandler == 'function') {
        $scope.recieveHandler();
      }

      $scope.chat = {};
    }
  });

  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.oldBack = $rootScope.$ionicGoBack;

    $rootScope.$ionicGoBack = function() {
      if (window.cordova && cordova.plugins.Keyboard.isVisible) {
        cordova.plugins.Keyboard.close();
        tabElements().removeClass('hidden-tabs');
        $timeout(function() {
          $scope.oldBack();
        }, 200);
      } else {
        $scope.oldBack();
      }
    };

    $scope.loadChat().then(function(chat) {
      var promises = [];

      $scope.loadMessages(chat.hash).then(function(msgs) {
        $scope.messages = msgs;

        window.addEventListener('native.keyboardshow', $scope.keyboardShow);
        window.addEventListener('native.keyboardhide', $scope.keyboardHide);

        $scope.msgsLoaded = true;

        if (chat.unread > 0 && chat.atBottom) {
          $timeout(function() {
            $ionicScrollDelegate.$getByHandle('chat-scroll').resize();
            $ionicScrollDelegate.$getByHandle('chat-scroll').scrollBottom(true);
          }, 50);
        }

        $scope.recieveHandler = $rootScope.$on('chat:new-message:' + chat.hash, function(e, msg) {
          $scope.messages.push(msg);
          var height = $ionicScrollDelegate.getScrollView().__maxScrollTop;
          var top = $ionicScrollDelegate.getScrollPosition().top;
          $ionicScrollDelegate.resize();

          if (height - top <= 50 || msg.fromApp) {
            $ionicScrollDelegate.scrollBottom(true);
          } else {
            if (!chat.unread) {
              chat.unread = 0;
            }

            chat.unread += 1;
            $rootScope.totalUnread += 1;
            $rootScope.$digest();
          }

          try {
            $scope.$digest();
          } catch (e) {}
        });
      });

      chat.users.forEach(function(user) {
        if (typeof user === 'object') {
          promises.push($q(function(resolve, reject) {
            $scope.users[user.id] = user;
            resolve(user);
          }));
        } else if (typeof user === 'string') {
          var p = User.getCached(user).then(function(res) {
            $scope.users[res.id] = res;
          });

          promises.push(p);
        }
      });

      $q.all(promises).then(function() {
        $scope.chat = chat;
        $scope.chatLoaded = true;
      });
    }).catch(function(err) {
      console.log('Chat not loaded');
    });
  });
});
