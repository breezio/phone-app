angular.module('neo.settings',['neo.settings.controllers','neo.settings.services'])
    .config(function($stateProvider) {

      $stateProvider
            .state('tab.settingsList', {
              url: '/settings',
              views: {
                'tab-settings': {
                  templateUrl: 'js/modules/settings/templates/settings.html',
                  controller: 'SettingsCtrl',
                },
              },
            })
            .state('tab.editProfile', {
              url: '/settings/profile',
              views: {
                'tab-settings': {
                  templateUrl: 'js/modules/settings/templates/profile.html',
                  controller: 'ProfileCtrl',
                },
              },
            });
    });
