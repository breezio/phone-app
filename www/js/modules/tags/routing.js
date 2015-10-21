angular.module('neo.tags', [])
  .factory('Tags', function(Resource) {
    return Resource('/tags/:tagId', {limit: 10}, {});
  });
