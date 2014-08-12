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
        resolve: {
          contacts: function(contactService) {
            return contactService.contactGroupedByName();
          }
        },
        views: {
          'activities': {
            templateUrl: 'views/home/main-activity.html',
            controller: function($scope, $state, growl, i18n, contacts, contactService) {

              var init = function() {
                $scope.contactId = '';
                $scope.showInfo = false;
                $scope.isLoading = false;
                $scope.isReporting = false;
                $scope.contactObj = contacts;
                $scope.contactNames = Object.keys($scope.contactObj);
                $scope.dailyVisit = {
                  symptoms: {},
                  dateOfVisit: new Date().toJSON(),
                  gpsCoords: {
                    lat: 0.0,
                    long: 0.0,
                    altitude: 0,
                    accuracy: 21
                  }
                };
              };

              init();

              $scope.getContactInfo = function() {
                $scope.isLoading = true;
                if (typeof $scope.contactId !== 'string' || ((typeof $scope.contactId === 'string') && $scope.contactId.length === 0)) {
                  growl.error(i18n('enterContactIdError'));
                  $scope.isLoading = false;
                  return;
                }

                var contact = $scope.contactObj[$scope.contactId];
                if (angular.isDefined(contact)) {
                  $scope.showInfo = true;
                  $scope.contactPerson = contact;
                } else {
                  growl.error(i18n('contactPersonNotFound'));
                  $scope.isLoading = false;
                }
              };

              $scope.reportDailyVisit = function() {
                //TODO: validate daily visit and save info
                $scope.isReporting = true;
                if (!angular.isArray($scope.contactPerson.dailyVisits)) {
                  $scope.contactPerson.dailyVisits = [];
                }
                $scope.contactPerson.dailyVisits.push($scope.dailyVisit);

                contactService.save($scope.contactPerson)
                  .then(function() {
                    init();
                    $state.go('home.index.home.mainActivity');
                    growl.success(i18n('reportSuccessMsg'));
                  })
                  .catch(function(reason) {
                    growl.error(i18n('reportFailedMsg'));
                    console.error(reason);
                  })
                  .finally(function() {
                    $scope.isReporting = false;
                  });
              };

              $scope.showForm = function() {
                $scope.showInfo = false;
                $scope.isLoading = false;
              };

            }
          }
        }
      });
  });
