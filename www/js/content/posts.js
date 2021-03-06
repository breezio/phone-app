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
        url: Config.url() + '/posts',
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
      url: Config.url() + '/posts/' + postId,
      params: params
    });

    promise.success(function(val) {
      posts[val.id] = val;
    });

    return promise;
  };

  funcs.experts = function(postId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: Config.url() + '/posts/' + postId + '/users/expert',
      params: params
    });

    promise.success(function(val) {
      posts[postId].experts = val.items;
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

.directive('breezioPost', function($compile, $timeout, $ionicScrollDelegate, Config) {

  function fixLinks(linkItems, attribute) {
    var r = new RegExp('^(?:[a-z]+:)?//', 'i');
    angular.forEach(linkItems, function(item) {
      var attr = item.getAttribute(attribute);
      if (!r.test(attr)) {
        item.setAttribute(attribute, Config.host + attr);
      }
    });
  };

  return {
    link: function(scope, element, attrs) {
      scope.$parent.$watch('post.content', function(val) {
        if (typeof val === 'object') {
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
          element.append($compile(item)(scope));
        } else if (typeof val === 'string') {
          var item = angular.element('<div class="post item item-text-wrap"></div>');
          item.append($compile(val)(scope));
          element.html('');
          element.append(item);
        } else {
          console.log('Post content format not handled');
        }

        var noteItems = document.querySelectorAll('breezio-post .post [name]');
        if (noteItems.length > 0) {
          var hrefItems = document.querySelectorAll('breezio-post .post [href]');
          if (hrefItems.length > 0) {
            fixLinks(hrefItems, 'href');
          }

          var srcItems = document.querySelectorAll('breezio-post .post [src]');
          if (srcItems.length > 0) {
            fixLinks(srcItems, 'src');
          }

          var timeoutHandler;
          var noteItems = angular.element(noteItems);

          noteItems.bind('touchstart', function(evt) {
            var oldPos = $ionicScrollDelegate.getScrollPosition();
            timeoutHandler = $timeout(function() {
              var newPos = $ionicScrollDelegate.getScrollPosition();
              if (Math.abs(oldPos.top - newPos.top) <= 10) {
                var name;
                var done = false;
                var target = angular.element(evt.target);
                while (!done) {
                  if (target[0].tagName != 'BREEZIO-POST') {
                    name = target.attr('name');
                    if (typeof name === 'string') {
                      done = true;
                    } else {
                      target = target.parent();
                    }
                  } else {
                    name = undefined;
                    done = true;
                  }
                }

                if (typeof name === 'string') {
                  scope.openNotes(name);
                }
              }
            }, 600);
          });

          noteItems.bind('touchend', function(evt) {
            $timeout.cancel(timeoutHandler);
          });
        }
      });
    }
  };
})

.controller('PostCtrl', function($scope, $state, $stateParams, $timeout, $ionicModal, Post, Chats, Auth) {
  $scope.post = {};
  $scope.alone = false;
  $scope.isOnline = Chats.isOnline;

  $scope.openNotes = function(noteId) {
    if ($scope.post.id && noteId) {
      $state.go('tab.content-notes', {postId: $scope.post.id, noteId: noteId});
    }
  };

  $scope.openGeneralNotes = function() {
    $state.go('tab.content-notes', {postId: $scope.post.id, noteId: 0});
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
    if ($scope.modal._isShown) {
      $scope.modal.hide();
      $timeout(function() {
        $state.go('tab.content-user', {userId: user.id});
      }, 250);
    } else {
      $state.go('tab.content-user', {userId: user.id});
    }

  };

  $ionicModal.fromTemplateUrl('templates/content-experts.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(m) {
    $scope.modal = m;
  });

  $scope.openChat = function(user, post) {
    if (Auth.loggedIn()) {
      $scope.modal.hide();
      var hash = Chats.newChat(post.title, user, [user.id, Auth.user().id], post);
      $timeout(function() {
        $state.go('tab.chats-chat', {hash: hash});
      }, 250);
    }
  };

  $scope.toggleExperts = function() {
    $scope.modal.show();
  };

  $scope.$on('$ionicView.loaded', function() {
    Post.getCached($stateParams.postId).success(function(val) {
      $scope.post = val;
      var tmp = new Date($scope.post.creationDate);
      $scope.post.dateString = tmp.getMonth() + '/' + tmp.getDay() + '/' + tmp.getFullYear();
      $scope.loaded = true;

      if (!$scope.post.experts) {
        Post.experts($stateParams.postId).success(function(val) {

          var found = false;
          angular.forEach(val.items, function(expert, key) {
            if (Auth.user() != null && expert.userId == Auth.user().id) {
              val.items.splice(key, 1);
            } else if (expert.userId == $scope.post.user.id) {
              found = true;
            }
          });

          if (!found && Auth.user() != null && $scope.post.user.id != Auth.user().id) {
            val.items.push({
              user: $scope.post.user,
              userId: $scope.post.user.id
            });
          }

          $scope.post.experts = val.items;
        });
      }
    });
  });
});
