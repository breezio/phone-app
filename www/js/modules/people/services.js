angular.module('neo.people.services', [])

    .run(function($rootScope, $ionicModal) {
      $ionicModal.fromTemplateUrl('js/modules/people/templates/show.html', {
        animation: 'slide-in-up',
        id: 'user',
      }).then(function(modal) {
        $rootScope.userModal = modal;
      });

      $rootScope.showUser = function(id) {
        $rootScope.userId = id;
        $rootScope.userModal.show();
      };

      $ionicModal.fromTemplateUrl('js/modules/people/templates/tag.html', {
        animation: 'slide-in-up',
        id: 'usertag',
      }).then(function(modal) {
        $rootScope.userTagModal = modal;
      });

      $rootScope.showUserTag = function(id, name) {
        $rootScope.tag = {id, name};
        $rootScope.userTagModal.show();
      };
    })
    .controller('PeopleShowCtrl', function($scope, $rootScope, User, UserTags) {
      $scope.showTag = $rootScope.showUserTag;

      $rootScope.$watch('loggedIn', function(val) {
        $scope.loggedIn = val;
      });

      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'user') {
          $scope.tags = UserTags.get({userId: $rootScope.userId}, function() {});
          $scope.user = User.get({userId: $rootScope.userId}, function() {
            $scope.user.isFollowing = $scope.user.isFollowing != false ? true : false;
          });
        }
      });

      $scope.endorse = function(item) {
        if (item.endorsed) {
          UserTags.unendorse({userId: $rootScope.userId, tagId: item.id}, {}, function(ret) {
            item.score = ret.score;
            if (ret.approved) {
              item.endorsed = false;
            }
          });
        } else if (!item.endorsed) {
          UserTags.endorse({userId: $rootScope.userId, tagId: item.id}, {
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

      $scope.userModal = $rootScope.userModal;

      $scope.followUser = function() {
        if ($scope.user.isFollowing) {
          User.unsubscribe({userId: $scope.user.id}, function() {
            $scope.user.isFollowing = false;
          });
        } else if (!$scope.user.isFollowing) {
          User.subscribe({userId: $scope.user.id}, {type: 'notify,feed'}, function() {
            $scope.user.isFollowing = true;
          });
        }
      };
    })
    .controller('UserTagModalCtrl', function($scope, $rootScope, User) {
      $scope.showUser = function(id) {
        $rootScope.showUser(id);
        $scope.modal.hide();
      };

      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'usertag') {
          $scope.tag = $rootScope.tag;
          $scope.users = User.query({tags: $scope.tag.id});
        }
      });
    })
    .factory('UserTags', function(Resource) {
      var actions = {
        endorse: {
          method: 'PUT',
          url: '/users/:userId/tags/:tagId/endorsements'
        },
        unendorse: {
          method: 'DELETE',
          url: '/users/:userId/tags/:tagId/endorsements'
        },
      };

      return Resource('/users/:userId/tags/:tagType', {}, actions);
    });
