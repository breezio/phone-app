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
        id: 'posttag',
      }).then(function(modal) {
        $rootScope.postTagModal = modal;
      });

      $rootScope.showPostTag = function(id, name) {
        $rootScope.tag = {id: id, name: name};
        $rootScope.postTagModal.show();
      };

      $ionicModal.fromTemplateUrl('js/modules/post/templates/filter.html', {
        animation: 'slide-in-up',
        id: 'postfilter',
      }).then(function(modal) {
        $rootScope.postFilterModal = modal;
      });

      $rootScope.postFilters = {};
      $rootScope.showPostFilter = function() {
        $rootScope.postFilterModal.show();
      };
    })
    .controller('PostFilterCtrl', function($scope, $rootScope, Tags) {
      var categories = $scope.categories = [
        ['project', 'Project'],
        ['subject', 'Subject'],
        ['work', 'Work'],
        ['education', 'Education'],
        ['skill', 'Skill'],
        ['knownfor', 'Known For'],
      ];

      $scope.addFilter = function(tag) {
        if ($scope.list.indexOf(tag) == -1) {
          $scope.list.push(tag);
        }
      };

      $scope.removeFilter = function(tag) {
        $scope.list.splice($scope.list.indexOf(tag), 1);
      };

      $scope.list = $rootScope.postFilterList = [];
      $scope.data = {};
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'postfilter') {
          categories.forEach(function(cat) {
            Tags.get({tagType: cat[0]}, function(tags) {
              $scope.data[cat[0]] = tags;
            });
          });
        }
      });
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
    .controller('PostTagModalCtrl', function($scope, $rootScope, Posts) {
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'posttag') {
          $scope.tag = $rootScope.tag;
          $scope.currentPost = $rootScope.currentPost;
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
