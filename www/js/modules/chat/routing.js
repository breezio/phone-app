angular.module('neo.chat', [])
  .factory('ChatToken', function(Resource) {
    return Resource('/chat/token', {}, {});
  })
  .run(function($rootScope, ChatToken) {
    $rootScope.chatToken == null;
    $rootScope.$watch('loggedIn', function(val) {
      if (val) {
        ChatToken.get({}, function(token) {
          $rootScope.chatToken = token;
        });
      } else {
        $rootScope.chatToken = null;
      }
    });
  });
