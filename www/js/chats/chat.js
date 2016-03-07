angular.module('breezio.chats.chat', [])

.controller('ChatCtrl', function($scope, $rootScope, $stateParams, $timeout, $ionicHistory, $q, User, Auth, Chats) {

  $scope.users = {};
  $scope.msgsLoaded = false;
  $scope.chatLoaded = false;
  $scope.exhausted = false;
  $scope.text = '';
  $scope.input = document.getElementById('chatInput');

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
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.send = function() {
    if ($scope.msgsLoaded && Chats.connected()) {
      $scope.text = '';

      $timeout(function() {
        $scope.input.focus();
      }, 50);
    }
  };

  $scope.loadMessages = function(hash) {
    return $q(function(resolve, reject) {
      var msgs = Chats.messages(hash);
      if (msgs && msgs.length < 1 && !$scope.exhausted) {
        var p = Chats.getMessages(hash).success(function(res) {
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

  $scope.$on('$ionicView.beforeEnter', function() {
    $scope.loadChat().then(function(chat) {
      var promises = [];

      $scope.loadMessages(chat.hash).then(function(msgs) {
        $scope.messages = msgs;
        $scope.msgsLoaded = true;
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
