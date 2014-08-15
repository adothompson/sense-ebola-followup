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
            controller: function($scope, $state, growl, i18n, contactService, locationFactory, syncService, utility, deviceInfoFactory) {
              $scope.today = new Date().toJSON();
              var init = function() {
                $scope.contactId = '';
                $scope.isSyncing = [];
                $scope.interviewerName = '';
                $scope.showInfo = false;
                $scope.isLoading = false;
                $scope.isReporting = false;
                $scope.contactObj = {};
                $scope.contactNames = Object.keys($scope.contactObj);
                contactService.contactGroupedByName()
                  .then(function(res) {
                    $scope.contactObj = res;
                    $scope.contactNames = Object.keys($scope.contactObj);
                  });

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
                var sortByDateOfVisitDesc = function(a, b) {
                  return new Date(a.dateOfVisit) < new Date(b.dateOfVisit);
                };
                contactService.getAllByDeviceId(deviceInfoFactory.getDeviceId())
                  .then(function(res) {
                    $scope.deviceVisits = res.sort(sortByDateOfVisitDesc);
                  });
              };

              init();

              $scope.getDate = function(d) {
                return new Date(d).toJSON();
              };

              $scope.getSyncStatus = function(c) {
                return syncService.getSyncStatus(c).synced;
              };

              $scope.syncContact = function(c, i) {
                $scope.isSyncing[i] = true;
                syncService.syncUpRecord(contactService.CONTACT_DB, c)
                  .finally(function() {
                    $scope.isSyncing[i] = false;
                  });
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

              var normaliseDecimal = function(num) {
                return parseFloat(num, 10).toFixed(2);
              };

              var isInvalidTemperature = function(temperature) {
                return temperature >= 100;
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
                  if (type === 'temperature') {
                    var decimal = normaliseDecimal(dailyVisit.symptoms.temperature);
                    if (isInvalid(decimal) || isInvalidTemperature(decimal)) {
                      invalids[type] = true;
                    } else {
                      dailyVisit.symptoms.temperature = decimal;
                    }
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
                $scope.dailyVisit.deviceId = deviceInfoFactory.getDeviceId();
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
                      contact.dailyVisits.push($scope.dailyVisit);
                      saveDailyVisits(contact);
                    })
                    .catch(function(err) {
                      console.info(err);
                      contact.dailyVisits.push($scope.dailyVisit);
                      saveDailyVisits(contact);
                    });
                }
              };

              var saveDailyVisits = function(contact) {
                var c = angular.copy(contact);
                contactService.save(c)
                  .then(function() {
                    return syncService.syncUpRecord(contactService.CONTACT_DB, c)
                      .then(function() {
                        $scope.isReporting = false;
                        growl.success(i18n('reportSubmitAndSyncSuccessMsg'));
                      })
                      .catch(function(err) {
                        $scope.isReporting = false;
                        console.log(err);
                        growl.success(i18n('reportSuccessMsg'));
                      })
                      .finally(function() {
                        $scope.isReporting = false;
                        console.info('syncing attempt completed.');
                        init();
                        $state.go('home.index.home.mainActivity');
                      });
                  })
                  .catch(function(reason) {
                    $scope.isReporting = false;
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
  })
;
