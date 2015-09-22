angular.module('neo.people.services', [])

    .run(function($rootScope, $ionicModal) {
      $ionicModal.fromTemplateUrl('js/modules/people/templates/show.html', {
        animation: 'slide-in-up',
        id: 'user',
      }).then(function(modal) {
        $rootScope.userModal = modal;
      });

      $rootScope.showUser = function(id) {
        $rootScope.userId = id;
        $rootScope.userModal.show();
      };
    })
    .controller('PeopleShowCtrl', function($scope, $rootScope, User, Tags) {
      $scope.loggedIn = $rootScope.loggedIn;
      $scope.$on('modal.shown', function(e, m) {
        if (m.id == 'user') {
          $scope.tags = Tags.get({userId: $rootScope.userId}, function() {});
          $scope.user = User.get({userId: $rootScope.userId}, function() {});
        }
      });

      $scope.userModal = $rootScope.userModal;
    })
    .factory('People', function(Resource) {
      return null;
    });
