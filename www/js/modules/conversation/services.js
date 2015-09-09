angular.module('neo.conversation.services', [])

    .factory('Conversations', function(Resource) {
      return Resource('/posts/:conversationId/:data');
    });
