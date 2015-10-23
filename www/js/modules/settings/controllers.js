angular.module('neo.settings.controllers', [])

    .controller('SettingsCtrl', function($scope, $rootScope, Auth, ModalViews) {
      $scope.loggedIn = $rootScope.loggedIn;
      $scope.currentUser = $rootScope.currentUser;
      $scope.showLogin = Auth.showLogin;
      $scope.logout = Auth.logout;

      $scope.showRegistration = function() {
        ModalViews.get('registration').show();
      };

      $scope.showUser = function(id) {
        $rootScope.userId = id;
        ModalViews.get('user').show();
      };
    })
    .controller('ProfileCtrl', function($scope, $rootScope, User) {
      $scope.refresh = function() {
        User.get({userId: $rootScope.currentUser.id}, function(user) {
          delete user.isFollowing;

          var config = {
            config: {
              digest: {
                default: {
                  digest: true,
                  group: false,
                  time: '+1 second',
                },
              },
              intro: {
                interventions: {
                  connect: 0,
                  content: 0,
                  invite: 0,
                  profile: 0,
                  share: 0,
                },
                startup: 0,
              },
            },
          };

          $scope.data = angular.extend(user, config);

          $scope.email = $rootScope.currentUser.email;
          $scope.updateProfile = function(data) {
            User.update({userId: $rootScope.currentUser.id}, data, function(ret) {
            });
          };
        });
      };

      $scope.refresh();
    });
