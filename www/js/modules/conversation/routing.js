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
            })
            .state('tab.conversationChat', {
              url: '/conversations/:conversationId',
              views: {
                	'tab-conversations': {
                  templateUrl: 'js/modules/conversation/templates/chat.html',
                  controller: 'ConversationChatCtrl',
                	},
              },
            })

            ;
    });
