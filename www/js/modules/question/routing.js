angular.module('neo.question',['neo.question.controllers','neo.question.services'])
    .config(function($stateProvider){

        $stateProvider
            .state('tab.questionList', {
                url: '/questions',
                views: {
                	'tab-questions': {
						templateUrl: 'js/modules/question/templates/list.html',
						controller: 'QuestionListCtrl'
                	}
                }
            })
            .state('tab.questionShow', {
                url: '/questions/:questionId',
                views: {
                	'tab-questions': {
						templateUrl: 'js/modules/question/templates/show.html',
						controller: 'QuestionShowCtrl'
                	}
                }
            })

            ;
    });