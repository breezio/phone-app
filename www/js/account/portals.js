angular.module('breezio.account.portals', [])

.controller('PortalCtrl', function($scope, $localStorage) {
  $scope.portal = '';

  if ($localStorage.portal) {
    $scope.portal = $localStorage.portal
  } else {
    $scope.portal = window.cordova ? 'health' : 'testing';
  }
});
