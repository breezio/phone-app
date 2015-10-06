angular.module('neo.post.services', [])

    .run(function($rootScope, $ionicModal, Posts) {
      $rootScope.followPost = function(id, cb) {
        Posts.subscribe({postId: id}, {type: 'notify,feed'}, function(ret) {
          cb(ret);
        });
      };

      $rootScope.unfollowPost = function(id, cb) {
        Posts.unsubscribe({postId: id}, function(ret) {
          cb(ret);
        });
      };

      $rootScope.currentPost = {
        post: null,
        notes: null,
        experts: null
      };

      $ionicModal.fromTemplateUrl('js/modules/post/templates/comments.html', {
        animation: 'slide-in-up',
      }).then(function(modal) {
        modal.scope.postComment = function() {
          modal.scope.$$childHead.text = '';
        };

        $rootScope.currentPost.commentModal = modal;
      });

      $ionicModal.fromTemplateUrl('js/modules/post/templates/tag.html', {
        animation: 'slide-in-up',
        id: 'tag',
      }).then(function(modal) {
        $rootScope.tagModal = modal;
      });

      $rootScope.showTag = function(id, name) {
        $rootScope.tag = {id: id, name: name};
        $rootScope.tagModal.show();
      };
    })
    .controller('CommentModalCtrl', function($scope, $rootScope, Notes, $ionicScrollDelegate) {
      $rootScope.$watch('loggedIn', function(val) {
        $scope.loggedIn = val;
      });

      $scope.showUser = $rootScope.showUser;
      $scope.currentPost = $rootScope.currentPost;
      $scope.notes = [];
      $scope.$watch('currentPost.notes', function(val) {
        if (val != undefined) {
          $scope.notes = [];
          for (var i in val.items) {
            if (!val.items[i].deleted) {
              $scope.notes = $scope.notes.concat(val.items[i]);
            }
          }

        }
      });

      $scope.postComment = function() {
        Notes.post({postId: $scope.currentPost.post.id}, {
          itemId: $scope.currentPost.post.id,
          content: $scope.$parent.$$childHead.text,
          section: 'posts',
          itemType: 'ARTICLE',
          elementId: '0',
        }, function() {
          $scope.$parent.$$childHead.text = '';
          Notes.get({postId: $scope.currentPost.post.id}, function(notes) {
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollBottom(true);
            $scope.currentPost.notes = notes;
          });
        });
      };

      $scope.refreshComments = function() {
        $rootScope.cacheFactory.removeAll();
        Notes.get({postId: $scope.currentPost.post.id}, function(notes) {
          $scope.currentPost.notes = notes;
          $scope.$broadcast('scroll.refreshComplete');
          $ionicScrollDelegate.resize();
          $ionicScrollDelegate.scrollBottom(true);
        });
      };
    })
    .controller('TagModalCtrl', function($scope, $rootScope, Posts) {
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'tag') {
          $scope.tag = $rootScope.tag;

          $scope.posts = Posts.query({
            start: $scope.start,
            limit: $scope.limit,
            tags: $scope.tag.id
          });
        }
      });

      $scope.showPost = function(id) {
        $scope.modal.hide();
        window.location.hash = '#/tab/posts/' + id;
      };
    })
    .filter('created', function() {
      return function(input) {
        if (input != undefined) {
          return 'Created On ' + input;
        }

        return '';
      };
    })
    .filter('member', function() {
      return function(input) {
        if (input != undefined) {
          return 'Member Since ' + input;
        }

        return '';
      };
    })
    .factory('Posts', function(Resource) {
      var actions = {
        subscribe: {
          method: 'POST',
          url: '/subscription/post/:postId'
        },
        unsubscribe: {
          method: 'DELETE',
          url: '/subscription/post/:postId'
        }
      };

      return Resource('/posts/:postId/:data', {fields: 'isFollowing'}, actions);
    })
    .factory('Experts', function(Resource) {
      return Resource('/posts/:postId/users/expert/:data', {fields: 'isFollowing'});
    })
    .factory('Notes', function(Resource) {
      var actions = {
        post: {
          url: '/posts/:postId/0/notes',
          method: 'POST',
        },
      };

      return Resource('/posts/:postId/notes', {fields: 'isFollowing'}, actions);
    })
    .factory('PostTags', function(Resource) {
      var actions = {
        endorse: {
          method: 'PUT',
          url: '/posts/:postId/tags/:tagId/endorsements'
        },
        unendorse: {
          method: 'DELETE',
          url: '/posts/:postId/tags/:tagId/endorsements'
        },
      };

      return Resource('/posts/:postId/tags/:tagType', {}, actions);
    });
