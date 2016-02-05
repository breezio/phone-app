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
  var posts = {};
  var funcs = {};

  funcs.get = function(postId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'GET',
      url: $rootScope.config.url + '/posts/' + postId,
      params: params
    });

    promise.success(function(val) {
      posts[val.id] = val;
    });

    return promise;
  };

  funcs.getCached = function(postId, params) {
    if (posts[postId]) {
      return {
        success: function(cb) {
          if (cb) {
            cb(posts[postId]);
          }
        }
      };
    } else {
      return funcs.get(postId, params);
    }
  };

  return funcs;
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

.controller('PostCtrl', function($scope, $state, $stateParams, Post) {
  $scope.post = {};
  $scope.expanded = false;
  $scope.alone = false;

  $scope.refreshPost = function() {
    Post.get($stateParams.postId).then(function(res) {
      $scope.post = res.data;
      $scope.post.dateString = (new Date($scope.post.creationDate)).toDateString();
    }).finally(function() {
      $scope.loaded = true;
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

  $scope.openUser = function(user) {
    $state.go('tab.content-user', {userId: user.id});
  };

  $scope.$on('$ionicView.loaded', function() {
    Post.getCached($stateParams.postId).success(function(val) {
      $scope.post = val;
      $scope.post.dateString = (new Date($scope.post.creationDate)).toDateString();
      $scope.loaded = true;
    });
  });
});
