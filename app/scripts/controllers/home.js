'use strict';

angular.module('lmisChromeApp')
  .config(function($urlRouterProvider, $stateProvider) {
    // Initial state
    $urlRouterProvider.otherwise('/loadingFixture');
    $stateProvider
      .state('home', {
        parent: 'root.index',
        templateUrl: 'views/home/index.html',
        resolve: {
          contacts: function(contactService) {
            return contactService.contactGroupedByName();
          }
        }
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
            controller: function($scope, $state, growl, i18n, contacts, contactService, locationFactory, syncService, utility) {

              var init = function() {
                $scope.contactId = '';
                $scope.interviewerName = '';
                $scope.showInfo = false;
                $scope.isLoading = false;
                $scope.isReporting = false;
                $scope.contactObj = contacts;
                $scope.contactNames = Object.keys($scope.contactObj);
                $scope.dailyVisit = {
                  symptoms: {
                    diarrhoea: undefined,
                    haemorrhagic: undefined,
                    headache: undefined,
                    maculopapular: undefined,
                    malaise: undefined,
                    musclePain: undefined,
                    pharyngitis: undefined,
                    temperature: undefined,
                    vomiting: undefined
                  },
                  dateOfVisit: new Date().toJSON(),
                  geoInfo: {}
                };
                $scope.invalid = {};
                var sortByDateLastContactedDesc = function(a, b) {
                  return new Date(a.modified) < new Date(b.modified);
                };
                contactService.all()
                  .then(function(res) {
                    var contactList = res;
                    contactList = contactList.filter(function(a) {
                      return utility.has(a, 'modified');
                    });
                    $scope.contactList = contactList.sort(sortByDateLastContactedDesc);
                  });
              };

              init();

              $scope.getDate = function(d) {
                return new Date(d).toJSON();
              };

              $scope.getContactInfo = function() {
                $scope.isLoading = true;

                if (typeof $scope.interviewerName !== 'string' || ((typeof $scope.interviewerName === 'string') && $scope.interviewerName.length === 0)) {
                  growl.error(i18n('interviewerNameError'));
                  $scope.isLoading = false;
                  return;
                }

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

              var isInvalid = function(value) {
                return (isNaN(value) || value === '');
              };

              var isValidate = function(dailyVisit) {
                var numberOfQuestions = 9;
                var invalids = {};
                var questionnaire = Object.keys(dailyVisit.symptoms);
                if (questionnaire.length !== numberOfQuestions) {
                  return {
                    diarrhoea: true,
                    haemorrhagic: true,
                    headache: true,
                    maculopapular: true,
                    malaise: true,
                    musclePain: true,
                    pharyngitis: true,
                    temperature: true,
                    vomiting: true
                  };
                }

                for (var type in dailyVisit.symptoms) {
                  var value = dailyVisit.symptoms[type];
                  if (type === 'temperature' && isInvalid(value)) {
                    invalids[type] = true;
                  } else {
                    if (type !== 'temperature' && value !== true && value !== false) {
                      invalids[type] = true;
                    }
                  }
                }
                return invalids;
              };

              $scope.reportDailyVisit = function() {

                $scope.isReporting = true;
                if (!angular.isArray($scope.contactPerson.dailyVisits)) {
                  $scope.contactPerson.dailyVisits = [];
                }
                $scope.dailyVisit.interviewer = $scope.interviewerName;
                var invalids = isValidate($scope.dailyVisit);
                $scope.invalid = invalids;

                if (Object.keys(invalids).length > 0) {
                  growl.error('Please, correct or answer question(s) marked with red comment.');
                  $scope.isReporting = false;
                } else {
                  var contact = angular.copy($scope.contactPerson);
                  contact.DateLastContact = new Date().toJSON();
                  locationFactory.getCurrentPosition()
                    .then(function(res) {
                      $scope.dailyVisit.geoInfo = res;
                      $scope.contactPerson.dailyVisits.push($scope.dailyVisit);
                      saveDailyVisits(contact);
                    })
                    .catch(function(err) {
                      console.info(err);
                      saveDailyVisits(contact);
                    });
                }
              };

              var saveDailyVisits = function(contact) {
                contactService.save(contact)
                  .then(function() {
                    return syncService.syncUpRecord(contactService.CONTACT_DB, contact)
                      .then(function() {
                        growl.success(i18n('reportSubmitAndSyncSuccessMsg'));
                      })
                      .catch(function(err) {
                        console.log(err);
                        growl.success(i18n('reportSuccessMsg'));
                      })
                      .finally(function() {
                        console.info('syncing attempt completed.');
                        init();
                        $state.go('home.index.home.mainActivity');
                      });
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
                $scope.invalid = {};
              };

            }
          }
        }
      });
  });
