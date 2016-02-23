angular.module('breezio.chats.roster', [])

.factory('Roster', function($rootScope, Chats, User, $q) {
  var funcs = {};

  funcs.get = function(connection) {
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
      funcs.get(c);
    });
  };

  return funcs;
})

.controller('RosterCtrl', function($scope, $rootScope, Roster) {
  $rootScope.$on('chat:roster', function(e, r) {
    $scope.items = r;
  });
});
