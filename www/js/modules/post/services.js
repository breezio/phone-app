angular.module('neo.post.services', [])

    .factory('Posts', function(Resource) {
      return Resource('/posts/:postId/:data');
    });