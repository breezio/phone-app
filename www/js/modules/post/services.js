angular.module('neo.post.services', [])

    .factory('Posts', function(Resource) {
      return Resource('/posts/:postId/:data');
    })
    .factory('Experts', function(Resource) {
      return Resource('/posts/:postId/users/expert/:data');
    })
    .factory('Notes', function(Resource) {
      return Resource('/posts/:postId/notes');
    })
    .factory('Tags', function(Resource) {
      return Resource('/users/:userId/tags/:tagType');
    })
    .service('CurrentPost', function($ionicModal) {
      var _item = null;
      var _notes = null;
      $ionicModal.fromTemplateUrl('js/modules/post/templates/comments.html', {
        animation: 'slide-in-up',
      }).then(function(modal) {
        modal.scope.postComment = function() {
          modal.scope.$$childHead.text = '';
        };
        data.commentModal = modal;
      });

      var data = {
        notes: _notes,
        item: _item,
        updateModal: function(vals) {
          data.modal.scope.item = vals.item;
          data.modal.scope.notes = vals.notes;
        },
      };

      return data;
    });
