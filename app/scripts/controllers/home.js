'use strict';

angular.module('lmisChromeApp')
  .config(function($urlRouterProvider, $stateProvider) {
    // Initial state
    $urlRouterProvider.otherwise('/loadingFixture');
    $stateProvider
      .state('home', {
      parent: 'root.index',
      templateUrl: 'views/home/index.html'
    })
      .state('home.index', {
        abstract: true,
        views: {
          'nav': {
            templateUrl: 'views/home/nav.html',
            controller: function($scope, $state) {
              $scope.$state = $state;
            }
          }
        }
      })
      .state('home.index.home', {
        abstract: true,
        templateUrl: 'views/home/home.html'
      })
      .state('home.index.home.mainActivity', {
        url: '/main-activity',
        data: {
          label: 'Home'
        },
        views: {
          'activities': {
            templateUrl: 'views/home/main-activity.html',
            controller: function($scope, $state) {
              $scope.patientIdNo = '';
              $scope.showInfo = false;

              $scope.getPatientInfo = function(){
                $scope.showInfo = true;
                //TODOs:
                // Load Patient Id
                // if does not exist, show error msg
                // if it exists, show patient info view
                console.log($scope.patientIdNo)
              };

              $scope.showForm = function(){
                $scope.showInfo = false;
              };

              $scope.showContactPerson = function(){
                $state.go('contactPerson')
              };

            }
          }
        }
      })
      .state('contactPerson', {
        parent: 'root.index',
        url: '/contact-person',
        templateUrl: 'views/home/contact-person.html',
        controller: function($scope){
          $scope.reportDailyVisit = function(){
            console.log('show report daily visit form.');
          };
        }
      });
  });
