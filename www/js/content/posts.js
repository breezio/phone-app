angular.module('breezio.content.posts', [])

.factory('Posts', function($http, Config) {
  return {
    get: function(params) {
      var params = angular.extend({
        limit: 20,
        start: 0
      }, params);


      return $http({
        method: 'GET',
        url: Config.url + '/posts',
        params: params
      });
    }
  };
})

.factory('Post', function($http, Config) {
  var posts = {};
  var funcs = {};

  funcs.get = function(postId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: Config.url + '/posts/' + postId,
      params: params
    });

    promise.success(function(val) {
      posts[val.id] = val;
    });

    return promise;
  };

  funcs.getCached = function(postId, params) {
    if (posts[postId]) {
      return {
        success: function(cb) {
          if (cb) {
            cb(posts[postId]);
          }
        }
      };
    } else {
      return funcs.get(postId, params);
    }
  };

  return funcs;
})

.directive('breezioPost', function($compile) {
  return {
    link: function(scope, element, attrs) {
      scope.$parent.$watch('post.content', function(val) {
        if (typeof val == 'object') {
          var item = angular.element('<div class="post item item-text-wrap"></div>');
          for (var i = 0; i < val.length; i++) {
            var blurb = val[i];

            var e;
            switch (blurb.type) {

            case 'paragraph':
              e = angular.element(document.createElement('p'));

              if (blurb.content == '&nbsp;') {
                e.addClass('empty');
              }

              e.html(blurb.content);
              break;

            case 'separator':
              e = angular.element(document.createElement('hr'));
              break;

            case 'heading':
              e = angular.element(document.createElement(blurb.headingType));
              e.html(blurb.content);
              break;

            case 'list':
              e = angular.element(document.createElement(blurb.listType));
              blurb.items.forEach(function(item) {
                var i = angular.element(document.createElement('li'));
                i.html(item);
                e.append(i);
              });
              break;

            default:
              e = angular.element(document.createElement('span'));
              break;
            }

            e.attr('name', blurb.id);
            e.addClass('blurb');
            item.append(e);
          }
          element.html('');
          element.append($compile(angular.element(item))(scope));
        } else {
          console.log('Post content format not handled');
        }
      });
    }
  };
})

.controller('PostCtrl', function($scope, $state, $stateParams, $timeout, Post, Chats, Auth) {
  $scope.post = {};
  $scope.alone = false;
  $scope.noteMode = false;

  $scope.openNotes = function(e) {
    var id = e.target.getAttribute('name');
    if (!e.target.classList.contains('empty') && $scope.noteMode && $scope.post.id && id) {
      var clear = $scope.$on('$ionicView.afterLeave', function() {
        $scope.toggleNotes();
        clear();
      });

      $state.go('tab.content-notes', {postId: $scope.post.id, noteId: id});
    }
  };

  $scope.openGeneralNotes = function() {
    if ($scope.noteMode) {
      var clear = $scope.$on('$ionicView.afterLeave', function() {
        $scope.toggleNotes();
        clear();
      });

      $state.go('tab.content-notes', {postId: $scope.post.id, noteId: 0});
    }
  };

  var noteBar = angular.element(document.querySelector('ion-header-bar.bar-subheader'));
  $scope.toggleNotes = function() {
    var post = angular.element(document.querySelectorAll('breezio-post .blurb'));
    if ($scope.noteMode) {
      noteBar.addClass('ng-hide');
      post.removeClass('note-mode');
    } else {
      noteBar.removeClass('ng-hide');
      post.addClass('note-mode');
    }

    $scope.noteMode = !$scope.noteMode;
  };

  $scope.refreshPost = function() {
    Post.get($stateParams.postId).then(function(res) {
      $scope.post = res.data;
      var tmp = new Date($scope.post.creationDate);
      $scope.post.dateString = tmp.getMonth() + '/' + tmp.getDay() + '/' + tmp.getFullYear();
    }).finally(function() {
      $scope.loaded = true;
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.subtitleExists = function() {
    if ($scope.post.subtitle && $scope.post.subtitle.length > 0) {
      return true;
    }

    return false;
  };

  $scope.openUser = function(user) {
    $state.go('tab.content-user', {userId: user.id});
  };

  $scope.openChat = function(post) {
    var hash = Chats.newChat(post.title, post.user, [post.user.id, Auth.user().id], post);
    $state.go('tab.chats-chat', {hash: hash});
  };

  $scope.$on('$ionicView.loaded', function() {
    Post.getCached($stateParams.postId).success(function(val) {
      $scope.post = val;
      var tmp = new Date($scope.post.creationDate);
      $scope.post.dateString = tmp.getMonth() + '/' + tmp.getDay() + '/' + tmp.getFullYear();
      $scope.loaded = true;
    });
  });
});
