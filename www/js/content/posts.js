angular.module('breezio.content.posts', [])

.factory('Posts', function($http, $rootScope) {
  return {
    get: function(params) {
      var params = angular.extend({
        limit: 20,
        start: 0
      }, params);


      return $http({
        method: 'GET',
        url: $rootScope.config.url + '/posts',
        params: params
      });
    }
  };
})

.factory('Post', function($http, $rootScope) {
  return {
    get: function(postId, params) {
      var params = angular.extend({}, params);

      return $http({
        method: 'GET',
        url: $rootScope.config.url + '/posts/' + postId,
        params: params
      });
    }
  };
})

.directive('breezioPost', function($compile) {
  return {
    link: function(scope, element, attrs) {
      scope.$parent.$watch('post.content', function(val) {
        if (typeof val == 'object') {
          var item = angular.element('<div class="post item item-text-wrap"></div>');
          for (var i = 0; i < val.length; i++) {
            var blurb = val[i];

            var e;
            switch (blurb.type) {

            case 'paragraph':
              e = angular.element(document.createElement('p'));
              e.html(blurb.content);
              break;

            case 'separator':
              e = angular.element(document.createElement('hr'));
              break;

            case 'heading':
              e = angular.element(document.createElement(blurb.headingType));
              e.html(blurb.content);
              break;

            case 'list':
              e = angular.element(document.createElement(blurb.listType));
              blurb.items.forEach(function(item) {
                var i = angular.element(document.createElement('li'));
                i.html(item);
                e.append(i);
              });
              break;

            default:
              e = angular.element(document.createElement('span'));
              break;
            }

            e.attr('name', blurb.id);
            item.append(e);
          }
          element.html('');
          element.append($compile(angular.element(item))(scope));
        } else {
          console.log('Post content format not handled');
        }
      });
    }
  };
})

.controller('PostCtrl', function($scope, $stateParams, Post) {
  $scope.post = {};
  $scope.expanded = false;
  $scope.alone = false;

  $scope.refreshPost = function() {
    Post.get($stateParams.postId).then(function(res) {
      $scope.post = res.data;
      $scope.post.dateString = (new Date($scope.post.creationDate)).toDateString();
    }).finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.subtitleExists = function() {
    if ($scope.post.subtitle && $scope.post.subtitle.length > 0) {
      return true;
    }

    return false;
  };

  $scope.expand = function() {
    $scope.expanded = !$scope.expanded;
  };

  $scope.$on('$ionicView.loaded', function() {
    $scope.refreshPost();
  });
});
