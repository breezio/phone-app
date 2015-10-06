angular.module('neo.post.controllers', [])

    .controller('PostListCtrl', function($scope, Posts, Auth) {

      $scope.searchKey = '';
      $scope.start = undefined;
      $scope.limit = 20;
      $scope.doneLoading = false;

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

      $scope.canLoadMore = function() {
        return !$scope.doneLoading;
      }

      $scope.loadMore = function() {
        	$scope.start = $scope.start || 0;
        	$scope.start = $scope.start + $scope.limit;
        Posts.query({start: $scope.start, limit: $scope.limit}, function(data) {
          if(data.length == 0) $scope.doneLoading = true;
          $scope.items = $scope.items.concat(data);
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });

      }

      $scope.items = Posts.query({start: $scope.start, limit: $scope.limit});
    })
    .controller('PostShowCtrl', function($scope, $rootScope, $stateParams, Posts, Experts, Notes, PostTags) {
      $scope.showUser = $rootScope.showUser;
      $scope.showTag = $rootScope.showTag;
      $scope.currentPost = $rootScope.currentPost;
      $scope.loggedIn = $rootScope.loggedIn;

      $scope.followPost = function() {
        if ($scope.item.isFollowing) {
          $rootScope.unfollowPost($scope.currentPost.post.id, function() {
            $scope.item.isFollowing = false;
          });
        } else if (!$scope.item.isFollowing) {
          $rootScope.followPost($scope.currentPost.post.id, function() {
            $scope.item.isFollowing = true;
          });
        }
      };

      $scope.renderedHtml = '';
      $scope.item = Posts.get({postId: $stateParams.postId}, function() {
        $scope.item.isFollowing = $scope.item.isFollowing != false ? true : false;
        $scope.currentPost.post = $scope.item;

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
            var u = '<ol>';
            for (var i in blurb.items) {
              var item = blurb.items[i];
              u += '<li>' + item + '</li>';
            }
            u += '</ol>';
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
        $scope.currentPost.experts = experts;
      });

      Notes.get({postId: $stateParams.postId}, function(notes) {
        $scope.currentPost.notes = notes;
      });

      PostTags.get({postId: $stateParams.postId}, function(tags) {
        $scope.tags = tags;
      });

      $scope.endorse = function(item) {
        if (item.endorsed) {
          PostTags.unendorse({postId: $stateParams.postId, tagId: item.id}, {}, function(ret) {
            item.score = ret.score;
            if (ret.approved) {
              item.endorsed = false;
            }
          });
        } else if (!item.endorsed) {
          PostTags.endorse({postId: $stateParams.postId, tagId: item.id}, {
            id: item.id,
            tagId: item.id,
            resourceId: $rootScope.userId
          }, function(ret) {
            item.score = ret.score;
            if (ret.approved) {
              item.endorsed = true;
            }
          });
        }
      };
    })
    .controller('UserExpertsCtrl', function($scope, $rootScope, $stateParams, Experts) {
      $scope.currentPost = $rootScope.currentPost;
      $scope.loggedIn = $rootScope.loggedIn;
      $scope.showUser = $rootScope.showUser;
    })
    .controller('CommentModalCtrl', function($scope, $rootScope, Notes, $ionicScrollDelegate) {
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

      $scope.$parent.$$childHead.currentUser = $rootScope.currentUser;
      $scope.postComment = function() {
        Notes.post({postId: $scope.currentPost.item.id}, {
          itemId: $scope.currentPost.item.id,
          content: $scope.$parent.$$childHead.text,
          section: 'posts',
          itemType: 'ARTICLE',
          elementId: '0',
        }, function() {
          $scope.$parent.$$childHead.text = '';
          Notes.get({postId: $scope.currentPost.item.id}, function(notes) {
            $ionicScrollDelegate.resize();
            $ionicScrollDelegate.scrollBottom(true);
            $scope.currentPost.notes = notes;
          });
        });
      };

      $scope.refreshComments = function() {
        Notes.get({postId: $scope.currentPost.item.id}, function(notes) {
          $scope.currentPost.notes = notes;
          $scope.$broadcast('scroll.refreshComplete');
          $ionicScrollDelegate.resize();
          $ionicScrollDelegate.scrollBottom(true);
        });
      };
    });
