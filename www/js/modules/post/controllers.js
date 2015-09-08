angular.module('neo.post.controllers', [])

    .controller('PostListCtrl', function($scope, Posts, Auth) {

      $scope.searchKey = '';
      $scope.start = undefined;
      $scope.limit = 20;


      $scope.clearSearch = function() {
        	$scope.start = undefined;
        $scope.searchKey = '';
        $scope.items = Posts.query();
      };

      $scope.search = function() {
        	$scope.start = undefined;
        $scope.items = Posts.query({query: $scope.searchKey, limit: $scope.limit});
      };

      $scope.refresh = function() {
        	$scope.start = undefined;
        Posts.queryFresh({limit: $scope.limit}, function(data) {
          $scope.items = data;
          $scope.$broadcast('scroll.refreshComplete');
        });
      };

      $scope.logout = function() {
        Auth.logout();
      }


      $scope.showLogin = function() {
        Auth.showLogin();
      }

      $scope.loadMore = function() {
        	$scope.start = $scope.start || 0;
        	$scope.start = $scope.start + $scope.limit;
        Posts.query({start: $scope.start, limit: $scope.limit}, function(data) {
          $scope.items = $scope.items.concat(data);
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });

      }

      $scope.items = Posts.query({start: $scope.start, limit: $scope.limit});
    })
    .controller('PostShowCtrl', function($scope, $rootScope, $stateParams, CurrentPost, Posts, Experts, Notes) {
      $scope.currentPost = CurrentPost;
      $scope.currentUser = $rootScope.currentUser;

      $scope.renderedHtml = '';
      $scope.item = Posts.get({postId: $stateParams.postId}, function() {
        CurrentPost.item = $scope.item;

        var html = '';
        for (var i in $scope.item.content) {
          var blurb = $scope.item.content[i];

          if (blurb.type == 'paragraph') {
            var p = '<p>%a</p>'.replace('%a', blurb.content);
            html += p;
          } else if (blurb.type == 'heading') {
            var h = '<%a>%b</%a>'.replace('%a', blurb.headingType)
                                 .replace('%b', blurb.content)
                                 .replace('%a', blurb.headingType);
            html += h;
          } else if (blurb.type == 'list') {
            var u = '<ul>';
            for (var i in blurb.items) {
              var item = blurb.items[i];
              u += '<li>' + item + '</li>';
            }
            u += '</ul>';
            html += u;
          } else if (blurb.type == 'code') {
            var c = '<pre>' + blurb.content + '</pre>';
            html += c;
          }
        }

        $scope.renderedHtml = html;
      });

      $scope.currentPost.experts = {items: {length: 0}};
      Experts.get({postId: $stateParams.postId}, function(experts) {
        CurrentPost.experts = experts;
      });

      Notes.get({postId: $stateParams.postId}, function(notes) {
        CurrentPost.notes = notes;

        $scope.showUser = function(id) {
          window.location.href = '#/tab/posts/user/' + id;
        }
      });
    })
    .controller('UserShowCtrl', function($scope, $rootScope, $stateParams, User, CurrentPost, Tags) {
      $scope.user = User.get({userId: $stateParams.userId}, function() {});
      $scope.currentPost = CurrentPost;
      $scope.tags = Tags.get({userId: $stateParams.userId}, function() {});
      $scope.currentUser = $rootScope.currentUser;

      console.log($rootScope.currentUser);
    })
    .controller('UserExpertsCtrl', function($scope, $rootScope, $stateParams, Experts, CurrentPost) {
      $scope.currentPost = CurrentPost;
      $scope.currentUser = $rootScope.currentUser;
    })
    .controller('CommentModalCtrl', function($scope, $rootScope, CurrentPost, Notes) {
      $scope.currentPost = CurrentPost;
      $scope.notes = [];
      $scope.$watch('currentPost.notes', function(val) {
        if(val != undefined) {
          $scope.notes = [];
          for(var i in val.items) {
            if(!val.items[i].deleted) {
              $scope.notes = $scope.notes.concat(val.items[i]);
            }
          }
        }
      });

      $scope.$parent.$$childHead.currentUser = $rootScope.currentUser;
      $scope.postComment = function() {
        Notes.post({postId: $scope.currentPost.item.id}, {
          itemId: $scope.currentPost.item.id,
          content: $scope.$parent.$$childHead.text,
          section: 'posts',
          itemType: 'ARTICLE',
          elementId: '0'
        }, function() {
          $scope.$parent.$$childHead.text = '';
          var notes = Notes.get({postId: CurrentPost.item.id}, function() {
            CurrentPost.notes = notes;
          });
        });
      };

      $scope.refreshComments = function() {
        Notes.get({postId: CurrentPost.item.id}, function(notes) {
          CurrentPost.notes = notes;
          $scope.$broadcast('scroll.refreshComplete');
        });
      };
    });
