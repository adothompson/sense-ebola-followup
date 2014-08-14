'use strict';

angular.module('lmisChromeApp')
  .config(function($stateProvider) {
    $stateProvider.state('root', {
      url: '',
      abstract: true,
      templateUrl: 'views/index/index.html'
    })
      .state('root.index', {
        abstract: true,
        views: {
          'header': {
            templateUrl: 'views/index/header.html',
            controller: function($scope, $window, i18n, deviceInfoFactory) {

              $scope.states = {
                online: i18n('online'),
                offline: i18n('offline')
              };

              $scope.status = {
                label: deviceInfoFactory.isOnline() ? $scope.states.online : $scope.states.offline
              };

              var toggleOnline = function(event) {
                $window.addEventListener(event, function(e) {
                  $scope.status = {
                    label: $scope.states[e.type]
                  };
                  $scope.$digest();

                }, false);
              };

              for (var state in $scope.states) {
                toggleOnline(state);
              }
            }
          },
          'content': {},
          'footer': {
            templateUrl: 'views/index/footer.html',
            controller: function($scope, $window) {
              var manifest = $window.chrome.runtime.getManifest();
              $scope.year = new Date().getFullYear();
              $scope.version = manifest.version;
            }
          }
        }
      })
      .state('loadingFixture', {
        parent: 'root.index',
        templateUrl: 'views/index/loading-fixture-screen.html',
        url: '/loading-fixture',
        controller: function($rootScope, $state) {
          $rootScope.$on('$stateChangeSuccess', function(event, to, toParams, from) {
            var main = 'home.index.home.mainActivity';
            if (from.name === main) {
              $state.go(main);
            }
          });
        }
      })
      .state('migrationScreen', {
        parent: 'root.index',
        templateUrl: 'views/index/migration-screen.html',
        url: '/migration-screen'
      });
  });
