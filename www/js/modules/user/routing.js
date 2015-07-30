angular.module('neo.user',['neo.user.controllers','neo.user.services'])
    .config(function($stateProvider){
        // $stateProvider
        //     .state('login', {
        //         url: '/login',
        //         templateUrl: 'js/modules/user/templates/login.html',
        //         controller: 'UserLoginCtrl'
        //     });
        $stateProvider
          .state('user', {
            url: '/user/:userId',
            templateUrl: 'js/modules/user/templates/show.html',
            controller: 'UserShowCtrl'
          });
    });
