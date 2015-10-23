angular.module('neo.people.services', [])

    .run(function($rootScope, ModalViews) {
      $rootScope.userFilterList = [];
      ModalViews.register('user', 'js/modules/people/templates/show.html');
      ModalViews.register('usertag', 'js/modules/people/templates/tag.html');
      ModalViews.register('userfilter', 'js/modules/people/templates/filter.html');
    })
    .controller('UserFilterCtrl', function($scope, $rootScope, Tags) {
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

      $scope.list = $rootScope.userFilterList = [];
      $scope.data = {};
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'userfilter') {
          categories.forEach(function(cat) {
            Tags.get({tagType: cat[0]}, function(tags) {
              $scope.data[cat[0]] = tags;
            });
          });
        }
      });
    })
    .controller('PeopleShowCtrl', function($scope, $rootScope, User, UserTags, ModalViews) {
      $scope.showTag = function(id, name) {
        $rootScope.tag = {id, name};
        ModalViews.get('usertag').show();
      };

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
            resourceId: $rootScope.userId,
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
          url: '/users/:userId/tags/:tagId/endorsements',
        },
        unendorse: {
          method: 'DELETE',
          url: '/users/:userId/tags/:tagId/endorsements',
        },
      };

      return Resource('/users/:userId/tags/:tagType', {}, actions);
    });
