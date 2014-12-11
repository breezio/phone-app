angular.module('neo.post.controllers', [])

    .controller('PostListCtrl', function ($scope, Posts, Auth) {

        $scope.searchKey = "";
        $scope.start = undefined;
        $scope.limit = 20;


        $scope.clearSearch = function () {
        	$scope.start = undefined;
            $scope.searchKey = "";
            $scope.items = Posts.query();
        };

        $scope.search = function () {
        	$scope.start = undefined;
            $scope.items = Posts.query({query: $scope.searchKey, limit: $scope.limit});
        };

        $scope.refresh = function () {
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
    .controller('PostShowCtrl', function ($scope, $stateParams, Posts) {

		$scope.item = Posts.get({postId: $stateParams.postId});
    })

    ;