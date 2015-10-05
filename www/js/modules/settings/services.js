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
    .controller('RegistrationCtrl', function($scope, $rootScope) {

    });
