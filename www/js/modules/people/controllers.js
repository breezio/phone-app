angular.module('neo.people.controllers', [])

    .controller('PeopleListCtrl', function($scope, User) {

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
          $scope.$broadcast('scroll.refreshComplete');
        });
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

    })
    .controller('PeopleShowCtrl', function($scope, $rootScope, $stateParams, User, CurrentPost, Tags) {
      $scope.user = User.get({userId: $stateParams.userId}, function() {});
      console.log($scope.user);
      $scope.currentPost = CurrentPost;
      $scope.tags = Tags.get({userId: $stateParams.userId}, function() {});
      $scope.currentUser = $rootScope.currentUser;
    });
