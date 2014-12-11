angular.module('neo.message.services', [])

    .factory('Messages', function (Resource) {
        return Resource('/posts/:messageId/:data');
    });