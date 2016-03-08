angular.module('breezio.chats.chat', [])

.controller('ChatCtrl', function($scope, $rootScope, $stateParams, $timeout, $ionicHistory, $ionicScrollDelegate, $q, User, Auth, Chats) {

  $scope.users = {};
  $scope.msgsLoaded = false;
  $scope.chatLoaded = false;
  $scope.text = '';
  $scope.input = document.getElementById('chatInput');
  $scope.chat = {};

  $scope.goBack = function() {
    $ionicHistory.goBack();
  };

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
    if ($scope.msgsLoaded && Chats.connected()) {
      Chats.send($scope.chat, $scope.text);
      $scope.text = '';

      $timeout(function() {
        $scope.input.focus();
      }, 50);
    }
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
    $scope.loadChat().then(function(chat) {
      var promises = [];

      $scope.loadMessages(chat.hash).then(function(msgs) {
        $scope.messages = msgs;
        $scope.msgsLoaded = true;

        $scope.recieveHandler = $rootScope.$on('chat:new-message:' + chat.hash, function(e, msg) {
          $scope.messages.push(msg);
          $ionicScrollDelegate.scrollBottom(true);
          $ionicScrollDelegate.resize();

          try {
            $scope.$digest();
          } catch (e) {}
        });
      });

      chat.users.forEach(function(user) {
        var p = User.getCached(user).then(function(res) {
          $scope.users[res.id] = res;
        });

        promises.push(p);
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
