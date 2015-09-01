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
    .controller('PostShowCtrl', function($scope, $stateParams, CurrentPost, Posts, Experts, Notes) {
      $scope.currentPost = CurrentPost;

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
      var experts = Experts.get({postId: $stateParams.postId}, function() {
        CurrentPost.experts = experts;
      });

      var notes = Notes.get({postId: $stateParams.postId}, function() {
        CurrentPost.notes = notes;

        $scope.showUser = function(id) {
          window.location.href = '#/tab/posts/user/' + id;
        }
      });
    })
    .controller('UserShowCtrl', function($scope, $stateParams, User) {
      $scope.user = User.get({userId: $stateParams.userId}, function() {
      });
    })
    .controller('UserExpertsCtrl', function($scope, $stateParams, Experts, CurrentPost) {
      $scope.currentPost = CurrentPost;
    })
    .controller('CommentModalCtrl', function($scope, CurrentPost) {
      $scope.currentPost = CurrentPost;
      $scope.postComment = function() {
        $scope.$parent.$$childHead.text = '';
      }
    });
