angular.module('neo.conversation.services', [])

    .factory('Conversations', function(Resource) {
      return Resource('/conversations/:conversationId');
    });
