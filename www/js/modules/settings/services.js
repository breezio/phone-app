angular.module('neo.settings.services', [])

    .run(function($rootScope, $ionicModal) {
      $ionicModal.fromTemplateUrl('js/modules/settings/templates/register.html', {
        animation: 'slide-in-up',
        id: 'registration',
      }).then(function(modal) {
        $rootScope.registrationModal = modal;
      });

      $rootScope.showRegistration = function() {
        $rootScope.registrationModal.show();
      };
    })
    .controller('RegistrationCtrl', function($scope, $rootScope, Config, $http, $localStorage) {
      $scope.register = function(val) {
        val.submit = "";
        $http.post(Config.baseUrl + '/user/register', val).success(function(res) {
          console.log(res);
          $scope.modal.hide();
        });
      };
    });
