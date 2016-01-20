angular.module('neo.post.controllers', [])

    .controller('PostListCtrl', function($scope, $rootScope, Posts, Auth, ModalViews) {
      $scope.showFilter = function() {
        ModalViews.get('postfilter').show();
      };

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
        var tags = '';
        //TODO: postFilterList should never be undefined
        if ($rootScope.postFilterList) {
          $rootScope.postFilterList.forEach(function(val) {
            tags += val.id + ',';
          });
          Posts.queryFresh({limit: $scope.limit, tags: tags}, function(data) {
            $scope.items = data;
            $scope.$broadcast('scroll.refreshComplete');
          });
        } else {
          $scope.$broadcast('scroll.refreshComplete');
        }
      };

      $rootScope.$watch('postFilterList.length', function(val) {
        $scope.refresh();
      });

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
          if (data.length == 0) $scope.doneLoading = true;
          $scope.items = $scope.items.concat(data);
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });

      }

      $scope.items = Posts.query({start: $scope.start, limit: $scope.limit});
    })
    .controller('PostShowCtrl', function($scope, $rootScope, $q, $stateParams, $sce, Posts, Experts, Notes, PostTags, ModalViews, ConversationHash) {

      $scope.trust = function(data) {
        return $sce.trustAsHtml(data);
      }

      $scope.message = function() {
        if ($rootScope.chats[$scope.hash]) {
          $rootScope.chat = $rootScope.chats[$scope.hash];
        } else {
          var chat = {
            title: $scope.currentPost.post.title,
            user: $scope.currentPost.post.user,
            chats: []
          };

          $rootScope.chats[$scope.hash] = chat;
          $rootScope.chat = chat;
        }
        ModalViews.get('chat').show();
      };

      $scope.showUser = function(id) {
        $rootScope.userId = id;
        ModalViews.get('user').show();
      };

      $scope.showTag = function(id, name) {
        $rootScope.tag = {id: id, name: name};
        ModalViews.get('posttag').show();
      };

      $scope.currentPost = $rootScope.currentPost;
      $scope.loggedIn = $rootScope.loggedIn;

      $scope.showComments = function() {
        ModalViews.get('postcomments').show();
      };

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

      // object initialization before fetching content
      $scope.renderedHtml = '';
      $scope.currentPost.experts = {items: {length: 0}};

      var promises = [];

      promises.push(Posts.get({postId: $stateParams.postId}).$promise);
      promises.push(Experts.get({postId: $stateParams.postId}).$promise);
      promises.push(Notes.get({postId: $stateParams.postId}).$promise);
      promises.push(PostTags.get({postId: $stateParams.postId}).$promise);

      var all = $q.all(promises);
      all.then(function(promises) {
        $scope.currentPost = {
          post: promises[0],
          experts: promises[1],
          notes: promises[2]
        };

        $rootScope.currentPost = $scope.currentPost;

        $scope.tags = promises[3];

        // post rendering
        $scope.item = $scope.currentPost.post;
        $scope.item.isFollowing = $scope.item.isFollowing != false ? true : false;
        $scope.hash = ConversationHash.generateHash([$scope.item.user.id, $rootScope.currentUser.id]);

        $rootScope.currentPost.hash = $scope.hash;

        if (typeof $scope.item.content == 'string') {
          $scope.renderedHtml = $scope.item.content;
        } else {
          var html = '';
          for (var i in $scope.item.content) {
            var blurb = $scope.item.content[i];

            if (blurb.type == 'paragraph') {
              var p = '<p name="%a">%b</p>'.replace('%a', blurb.id)
                                           .replace('%b', blurb.content);
              html += p;
            } else if (blurb.type == 'heading') {
              var h = '<%a name="%b">%c</%a>'.replace('%a', blurb.headingType)
                                             .replace('%b', blurb.id)
                                             .replace('%c', blurb.content)
                                             .replace('%a', blurb.headingType);
              html += h;
            } else if (blurb.type == 'list') {
              var u = '<ol name="' + blurb.id + '">';
              for (var i in blurb.items) {
                var item = blurb.items[i];
                u += '<li>' + item + '</li>';
              }
              u += '</ol>';
              html += u;
            } else if (blurb.type == 'code') {
              var c = '<pre name="' + blurb.id + '">' + blurb.content + '</pre>';
              html += c;
            }
          }
          $scope.renderedHtml = html;
        }
      });

      $scope.postContent = document.getElementById('post-content');
      $scope.$watch('postContent.children.length', function(val) {
        if (val > 0) {
          for (var i = 0; i < val; i++) {
            var old;
            $scope.postContent.children[i].onclick = function(e) {
              var c = document.getElementById('inline-comments');
              if (c != null) {
                c.classList.remove('active');
                c.classList.add('inactive');
                setTimeout(function() {
                  c.remove();
                }, 250);

                if (old == e.currentTarget) {
                  return;
                }
              }
              var comments = document.createElement('div');
              comments.classList.add('inline-comments', 'bar', 'bar-dark', 'active');
              comments.id = 'inline-comments';
              comments.innerHTML = '<p>asdf</p><p>asdf</p><p>asdf</p><p>asdf</p><p>asdf</p><p>asdf</p><p>asdf</p><p>asdf</p><p>asdf</p>';
              e.currentTarget.insertAdjacentHTML('afterend', comments.outerHTML);
              old = e.currentTarget;
            }

            $scope.postContent.children[i].classList.add('element');
          }
        }
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
            resourceId: $rootScope.userId,
          }, function(ret) {
            item.score = ret.score;
            if (ret.approved) {
              item.endorsed = true;
            }
          });
        }
      };
    })
    .controller('UserExpertsCtrl', function($scope, $rootScope, Experts, Roster, ModalViews, ConversationHash) {
      $scope.currentPost = $rootScope.currentPost;
      $scope.loggedIn = $rootScope.loggedIn;

      $scope.inRoster = function(id) {
        if ($rootScope.roster[id]) {
          return true;
        } else {
          return false;
        }
      };

      $scope.message = function(user) {
        var hash = ConversationHash.generateHash([user.id, $rootScope.currentUser.id]);
        if ($rootScope.chats[hash]) {
          $rootScope.chat = $rootScope.chats[hash];
        } else {
          var chat = {
            title: $scope.currentPost.post.title,
            user: user,
            chats: []
          };

          $rootScope.chats[hash] = chat;
          $rootScope.chat = chat;
        }
        ModalViews.get('chat').show();
      };


      $scope.showUser = function(id) {
        $rootScope.userId = id;
        ModalViews.get('user').show();
      };

      $scope.addToChat = function(id) {
        return Roster.addToChat(id);
      };
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
