angular.module('breezio.content.notes', [])

.factory('Notes', function($http, Config) {
  var funcs = {};
  var notes = {};

  funcs.get = function(postId, noteId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: Config.url + '/posts/' + postId + '/' + noteId + '/notes',
      params: params
    });

    promise.success(function(val) {
      notes[postId + noteId] = val;
    });

    return promise;
  };

  funcs.getCached = function(postId, noteId, params) {
    if (notes[postId + noteId]) {
      return {
        success: function(cb) {
          if (cb) {
            cb(notes[postId + noteId]);
          }
        }
      };
    } else {
      return funcs.get(postId, noteId, params);
    }
  };

  funcs.post = function(postId, noteId, data, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'POST',
      url: Config.url + '/posts/' + postId + '/' + noteId + '/notes',
      params: params,
      data: data
    });

    return promise;
  };

  return funcs;
})

.controller('NoteCtrl', function($scope, $rootScope, $q, $stateParams, $timeout, Post, Notes) {

  $scope.text = '';
  $scope.posting = false;
  $scope.input = document.getElementById('noteInput');

  $scope.formatLine = function(items, index) {
    var line = items[index];

    return '<strong>' + line.user.username + '</strong> ' + line.content;
  };

  $scope.send = function() {
    if ($scope.notesLoaded && !$scope.posting && $scope.text != '') {
      $scope.posting = true;
      Notes.post($stateParams.postId, $stateParams.noteId, {
        content: $scope.text,
        elementId: $stateParams.noteId,
        itemId: $stateParams.postId,
        itemType: 'ARTICLE',
        parentId: 0,
        section: 'posts'
      }).success(function(val) {
        $scope.items.push(val);
        $scope.text = '';

        $timeout(function() {
          if (window.cordova) {
            cordova.plugins.Keyboard.show();
          }

          $scope.input.focus();
        }, 10);
      });
    }
  };

  $scope.loadPost = function() {
    return $q(function(resolve, reject) {
      Post.getCached($stateParams.postId).success(function(ret) {
        resolve(ret);
      });
    });
  };

  $scope.loadNotes = function() {
    return $q(function(resolve, reject) {
      Notes.get($stateParams.postId, $stateParams.noteId).success(function(ret) {
        resolve(ret);
      });
    });
  };

  $scope.$on('$ionicView.beforeEnter', function() {
    var promises = [];

    $scope.loadPost().then(function(post) {
      $scope.post = post;
      $scope.postLoaded = true;

      $scope.loadNotes().then(function(notes) {
        $scope.items = notes.items;
        $scope.notesLoaded = true;
      });
    });
  });
});
