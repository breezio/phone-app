angular.module('neo.conversation',['neo.conversation.controllers','neo.conversation.services'])
    .config(function($stateProvider) {

      $stateProvider
            .state('tab.conversationList', {
              url: '/conversations',
              views: {
                	'tab-conversations': {
                  templateUrl: 'js/modules/conversation/templates/list.html',
                  controller: 'ConversationListCtrl',
                	},
              },
            });
    });
