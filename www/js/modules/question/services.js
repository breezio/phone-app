angular.module('neo.question.services', [])

    .factory('Questions', function (Resource) {
        return Resource('/posts/:questionId/:data');
    });