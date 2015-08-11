angular.module('neo.message',['neo.message.controllers','neo.message.services'])
    .config(function($stateProvider) {

      $stateProvider
            .state('tab.messageList', {
              url: '/messages',
              views: {
                	'tab-messages': {
                  templateUrl: 'js/modules/message/templates/list.html',
                  controller: 'MessageListCtrl',
                	},
              },
            })
            .state('tab.messageShow', {
              url: '/messages/:messageId',
              views: {
                	'tab-messages': {
                  templateUrl: 'js/modules/message/templates/show.html',
                  controller: 'MessageShowCtrl',
                	},
              },
            })

            ;
    });