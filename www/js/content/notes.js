angular.module('breezio.content.notes', [])

.factory('Notes', function($http, Config) {
  var funcs = {};
  var notes = {};

  funcs.get = function(postId, noteId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: Config.url() + '/posts/' + postId + '/' + noteId + '/notes',
      params: params
    });

    promise.success(function(val) {
      notes[postId + noteId] = val;
    });

    return promise;
  };

  funcs.general = function(postId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: Config.url() + '/posts/' + postId + '/notes',
      params: params
    });

    promise.success(function(val) {
      notes[postId] = val;
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
      url: Config.url() + '/posts/' + postId + '/' + noteId + '/notes',
      params: params,
      data: data
    });

    return promise;
  };

  return funcs;
})

.controller('NoteCtrl', function($scope, $rootScope, $q, $stateParams, $timeout, $ionicScrollDelegate, $ionicTabsDelegate, Post, Notes) {

  $scope.text = '';
  $scope.posting = false;
  $scope.input = document.getElementById('noteInput');

  var tabElements = function() {
    return angular.element(document.querySelectorAll('.has-tabs'));
  };
 
  $scope.keyboardShow = function() {
    $ionicTabsDelegate.showBar(false);
    tabElements().addClass('hidden-tabs');
    $ionicScrollDelegate.scrollBottom(true);
  };

  $scope.keyboardHide = function() {
    $ionicTabsDelegate.showBar(true);
    tabElements().removeClass('hidden-tabs');
    $ionicScrollDelegate.scrollBottom(true);
  };

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
        $ionicScrollDelegate.scrollBottom(true);
      }).finally(function() {
        $scope.text = '';
        $scope.posting = false;
      });

      $timeout(function() {
        if (window.cordova) {
          cordova.plugins.Keyboard.show();
        }

        $scope.input.focus();
      }, 10);
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
      if ($stateParams.noteId == '0') {
        Notes.general($stateParams.postId).success(function(ret) {
          resolve(ret);
        });
      } else {
        Notes.get($stateParams.postId, $stateParams.noteId).success(function(ret) {
          resolve(ret);
        });
      }
    });
  };

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

    window.addEventListener('native.keyboardshow', $scope.keyboardShow);
    window.addEventListener('native.keyboardhide', $scope.keyboardHide);
    var promises = [];

    $scope.loadPost().then(function(post) {
      $scope.post = post;
      $scope.postLoaded = true;

      $scope.loadNotes().then(function(notes) {
        $scope.items = notes.items;
        $scope.notesLoaded = true;
        $ionicScrollDelegate.scrollBottom(true);
      });
    });
  });
 
  $scope.$on('$ionicView.beforeLeave', function() {
    $rootScope.$ionicGoBack = $scope.oldBack;
    window.removeEventListener('native.keyboardshow', $scope.keyboardShow);
    window.removeEventListener('native.keyboardhide', $scope.keyboardHide);
  });
});
