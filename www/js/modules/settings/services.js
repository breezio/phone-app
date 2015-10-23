angular.module('neo.settings.services', [])

    .run(function($rootScope, ModalViews) {
      ModalViews.register('registration', 'js/modules/settings/templates/register.html');
    })
    .controller('RegistrationCtrl', function($scope, $rootScope, Config, $http, $localStorage) {
      $scope.register = function(val) {
        val.submit = '';
        $http.post(Config.baseUrl + '/user/register', val).success(function(res) {
          console.log(res);
          $scope.modal.hide();
        });
      };
    });
