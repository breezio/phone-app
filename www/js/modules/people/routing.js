angular.module('neo.people',['neo.people.controllers','neo.people.services'])
    .config(function($stateProvider) {
      
      $stateProvider
            .state('tab.peopleList', {
              url: '/people',
              views: {
                'tab-people': {
                  templateUrl: 'js/modules/people/templates/list.html',
                  controller: 'PeopleListCtrl',
                },
              },
            });
    });
