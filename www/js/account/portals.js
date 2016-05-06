angular.module('breezio.account.portals', [])

.controller('PortalCtrl', function($scope, $timeout, $http, $rootScope, $ionicLoading, $ionicNativeTransitions, Config) {
  $scope.form = {portal: Config.portal, spin: false};

  $scope.connect = function() {
    var url = Config.toHost($scope.form.portal);

    $scope.form.spin = true;
    $timeout(function() {
      $scope.form.spin = false;
    }, 5000);

    $http({
      method: 'GET',
      url: url + '/api/1/posts?limit=1'
    }).then(function(ret) {
      $scope.form.spin = false;
      if (ret.status == 200) {
        Config.setPortal($scope.form.portal, url);
        $rootScope.reload = true;

        $ionicNativeTransitions.stateGo('tab.content', {}, {
          type: 'fade',
          duration: 300
        }, { reload: true });
      } else {
        $ionicLoading.show({
          template: 'Could not reach ' + url,
          duration: 1000
        });
      }
    });
  };
});
