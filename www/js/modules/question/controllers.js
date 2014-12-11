angular.module('neo.question.controllers', [])
    .controller('QuestionListCtrl', function ($scope, Questions, $cordovaCapture, $cordovaSocialSharing, Auth) {

        $scope.searchKey = "";
        $scope.start = undefined;
        $scope.limit = 20;

        $scope.clearSearch = function () {
        	$scope.start = undefined;
            $scope.searchKey = "";
            $scope.items = Questions.query();
        };

        $scope.search = function () {
        	$scope.start = undefined;
            $scope.items = Questions.query({query: $scope.searchKey, limit: $scope.limit});
        };

        $scope.refresh = function () {
        	$scope.start = undefined;        	
            Questions.query({limit: $scope.limit}, function(data) {
            	$scope.items = data;
				$scope.$broadcast('scroll.refreshComplete');            	
            });
        };

        $scope.loadMore = function() {
        	$scope.start = $scope.start || 0;        	
        	$scope.start = $scope.start + $scope.limit;
            Questions.query({start: $scope.start, limit: $scope.limit}, function(data) {
            	$scope.items = $scope.items.concat(data);
				$scope.$broadcast('scroll.infiniteScrollComplete');
            });

        }

        $scope.capture = function() {
            console.log('Capturing...');
            $cordovaCapture.captureAudio({ limit: 3, duration: 10 }, function(audioData) {
                console.log(audioData);
            })
        }

        $scope.share = function() {
            console.log('Sharing...');
            $cordovaSocialSharing
                .share('Hello!', 'Hi')
                .then(function(result) {
                  console.log(JSON.stringify(result));
                }, function(err) {
                  // An error occured. Show a message to the user
                });
        }

		$scope.items = Questions.query({start: $scope.start, limit: $scope.limit});
    })
    .controller('QuestionShowCtrl', function ($scope, $stateParams, $document, Questions, $ionicGesture) {

		$scope.item = Questions.get({questionId: $stateParams.questionId});

        $ionicGesture.on('swipe', function(a,b,c) {
            debugger;
        }, $document.find('.knob'));
    })

    ;