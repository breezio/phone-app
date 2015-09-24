angular.module('neo.people.controllers', [])

    .controller('PeopleListCtrl', function($scope, $rootScope, User) {
      $scope.showUser = $rootScope.showUser;

      $scope.searchKey = '';
      $scope.start = undefined;
      $scope.limit = 20;
      $scope.doneLoading = false;

      $scope.clearSearch = function() {
        $scope.start = undefined;
        $scope.searchKey = '';
        $scope.items = User.query();
      };

      $scope.search = function() {
        $scope.start = undefined;
        $scope.items = User.query({query: $scope.searchKey, limit: $scope.limit});
      };

      $scope.refresh = function() {
        $scope.start = undefined;
        User.queryFresh({query: $scope.searchKey, limit: $scope.limit}, function(data) {
          $scope.items = data;

          for (var i = 0; i < $scope.items.length; i++) {
            var item = $scope.items[i];
            item.isFollowing = item.isFollowing != false ? true : false;
          }

          $scope.$broadcast('scroll.refreshComplete');
        });
      };

      $scope.followUser = function(user) {
        if (user.isFollowing) {
          User.unsubscribe({userId: user.id}, function() {
            user.isFollowing = false;
          });
        } else if (!user.isFollowing) {
          User.subscribe({userId: user.id}, {type: 'notify,feed'}, function() {
            user.isFollowing = true;
          });
        }
      };

      $scope.canLoadMore = function() {
        return !$scope.doneLoading;
      };

      $scope.loadMore = function() {
        $scope.start = $scope.start || 0;
        $scope.start = $scope.start + $scope.limit;
        User.query({start: $scope.start, limit: $scope.limit}, function(data) {
          if(data.length == 0) $scope.doneLoading = true;
          $scope.items = $scope.items.concat(data);
          $scope.$broadcast('scroll.infiniteScrollComplete');
        });
      };

      $scope.items = User.query({start: $scope.start, limit: $scope.limit});

    });
