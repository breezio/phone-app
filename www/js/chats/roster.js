angular.module('breezio.chats.roster', [])

.factory('Roster', function($rootScope, Chats, User, $q, $http, Config) {
  var funcs = {};
  var roster;

  funcs.roster = function() {
    return roster;
  };

  funcs.add = function(id) {
    return $http({
      url: Config.url + '/chat/users/' + id,
      method: 'POST'
    }).then(function(ret) {
      if (ret.data.success == true) {
        funcs.get();
      }
    });
  };

  funcs.get = function() {
    var connection = Chats.connection();
    return $q(function(resolve, reject) {
      connection.roster.get(function(roster) {
        var users = [];
        roster.forEach(function(val) {
          var id = Chats.jidToId(val.jid);
          var p = User.getCached(id);
          users.push(p);

          p.then(function(ret) {
            val.user = ret;
          });
        });

        $q.all(users).then(function() {
          roster.sort(function(a, b) {
            if (a.user.firstName < b.user.firstName) {
              return -1;
            }

            if (a.user.firstName > b.user.firstName) {
              return 1;
            }

            if (a.user.firstName == b.user.firstName) {
              return 0;
            }
          });

          console.log('Roster fetched');
          $rootScope.$broadcast('chat:roster', roster);
          resolve(roster);
        });
      });
    });
  };

  funcs.init = function() {
    $rootScope.$on('chat:connected', function(e, c) {
      funcs.get();
    });

    $rootScope.$on('chat:roster', function(e, r) {
      roster = r;
    });
  };

  return funcs;
})

.controller('RosterCtrl', function($scope, $rootScope, $state, Roster, Chats, Auth) {
  $scope.presence = {};

  $scope.isOnline = Chats.isOnline;

  $scope.openChat = function(item) {
    var hash = Chats.newChat(item.user.firstName + ' ' + item.user.lastName, item.user, [item.user.id, Auth.user().id]);
    $state.go('chat', {hash: hash});
  };

  $scope.$on('$ionicView.beforeEnter', function() {
    if (Roster.roster()) {
      $scope.items = Roster.roster();
    }

    $rootScope.$on('chat:roster', function(e, r) {
      $scope.items = r;
    });

    $rootScope.$on('chat:new-presence', function(e, p) {
      $scope.$digest();
    });
  });
});
