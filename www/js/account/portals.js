angular.module('breezio.account.portals', [])

.controller('PortalCtrl', function($scope, $http, $rootScope, $ionicLoading, $state, Config) {
  $scope.form = {portal: Config.portal};

  $scope.connect = function() {
    $http({
      method: 'GET',
      url: Config.toHost($scope.form.portal) + '/api/1/posts?limit=1'
    }).then(function(ret) {
      if (ret.status == 200) {
        Config.setPortal($scope.form.portal, Config.toHost($scope.form.portal));
        $rootScope.reload = true;
        $state.go('tab.content', {}, {reload: true});
      } else {
        $ionicLoading.show({
          template: 'Could not reach ' + Config.toHost($scope.login.portal),
          duration: 1000
        });
      }
    });
  };
});
