angular.module('breezio.account.portals', [])

.controller('PortalCtrl', function($scope, $http, $rootScope, $ionicLoading, $state, Config) {
  $scope.form = {portal: Config.portal};

  $scope.connect = function() {
    var url = Config.toHost($scope.form.portal);

    $http({
      method: 'GET',
      url: url + '/api/1/posts?limit=1'
    }).then(function(ret) {
      if (ret.status == 200) {
        Config.setPortal($scope.form.portal, url);
        $rootScope.reload = true;
        $state.go('tab.content', {}, {reload: true});
      } else {
        $ionicLoading.show({
          template: 'Could not reach ' + url,
          duration: 1000
        });
      }
    });
  };
});
