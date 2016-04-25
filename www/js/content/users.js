angular.module('breezio.content.users', [])

.factory('User', function($http, $q, Config) {
  var users = {};
  var funcs = {};

  funcs.get = function(userId, params) {
    var params = angular.extend({
      fields: 'isFollowing'
    }, params);

    var promise = $http({
      method: 'GET',
      url: Config.url() + '/users/' + userId,
      params: params
    });

    promise.success(function(val) {
      users[val.id] = val;
    });

    return promise;
  };

  funcs.getCached = function(userId, params) {
    return $q(function(resolve, reject) {
      if (users[userId]) {
        resolve(users[userId]);
      } else {
        funcs.get(userId, params).success(function(val) {
          resolve(val);
        }).error(function(val) {
          reject(val);
        });
      }
    });
  };

  funcs.getBulk = function(ids, params) {
    return $q(function(resolve, reject) {
      var params = angular.extend({
        ids: ids.join(',')
      }, params);

      var promise = $http({
        method: 'GET',
        url: Config.url() + '/users',
        params: params
      });

      promise.success(function(val) {
        angular.forEach(val.items, function(user) {
          users[user.id] = user;
        });

        resolve(val.items);
      }).error(function(val) {
        reject(val);
      });
    });
  };

  funcs.follow = function(userId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'POST',
      url: Config.url() + '/subscription/user/' + userId,
      data: {type: 'notify,feed'},
      params: params
    });

    return promise;
  };

  funcs.unfollow = function(userId, params) {
    var params = angular.extend({}, params);

    var promise = $http({
      method: 'DELETE',
      url: Config.url() + '/subscription/user/' + userId,
      data: {type: 'notify,feed'},
      params: params
    });

    return promise;
  };

  funcs.toggleFollow = function(user) {
    if (user.isFollowing == false) {
      return funcs.follow(user.id);
    } else {
      return funcs.unfollow(user.id);
    }
  };

  return funcs;
})

.directive('breezioUser', function(Auth, User, Chats, Roster, $rootScope, $stateParams, $state) {
  return {
    templateUrl: 'templates/breezio-user.html',
    link: function(scope, element, attrs) {
      scope.followText = false;
      scope.rosterText = false;

      scope.openWebsite = function() {
        if (scope.user.website) {
          window.open(scope.user.website, '_system');
        }
      };

      scope.addToChat = function() {
        if (scope.loaded) {
          Roster.add(scope.user.id);
        }
      };

      scope.follow = function(user) {
        User.toggleFollow(user).success(function() {
          if (user.isFollowing == false) {
            scope.followText = 'Unfollow';
            user.isFollowing = ['notify', 'feed'];
          } else {
            scope.followText = 'Follow';
            user.isFollowing = false;
          }
        });
      };

      if (attrs.profile == '') {
        scope.profile = true;
      }

      scope.$parent.$watch('user', function(user) {
        if (user && user.then) {
          user.then(function(val) {
            scope.$emit('loaded', val);
          });
        }

        if (user && user.id) {
          scope.$emit('loaded', user);
        }

        if (!user) {
          scope.loggedIn = false;
        }
      });

      scope.$on('loaded', function(e, user) {
        e.stopPropagation();
        scope.user = user;

        if (scope.user.isFollowing == false) {
          scope.followText = 'Follow';
        } else {
          scope.followText = 'Unfollow';
        }

        var setRosterText = function(r) {
          if(Roster.onList(scope.user.id)) {
            scope.rosterText = false;
          } else {
            scope.rosterText = 'Add to roster';
          }
        };

        var roster = Roster.roster();
        if (roster) {
          setRosterText(roster);
        } else {
          $rootScope.$on('chat:roster', function(e, r) {
            setRosterText(r);
          });
        }

        scope.loaded = true;
        scope.loggedIn = Auth.loggedIn();
      });

      $rootScope.$on('auth:logged-in', function() {
        scope.loggedIn = true;
      });

      $rootScope.$on('auth:logged-out', function() {
        scope.loggedIn = false;
      });
    }
  };
})

.controller('UserCtrl', function($scope, $rootScope, User, $stateParams) {
  $scope.refreshUser = function() {
    var p = User.get($stateParams.userId);
    p.success(function(u) {
      $scope.user = u;
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.$on('$ionicView.beforeEnter', function() {
    User.getCached($stateParams.userId).then(function(u) {
      $scope.user = u;
      $scope.loaded = true;
    });
  });
});
