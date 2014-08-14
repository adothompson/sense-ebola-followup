'use strict';

angular.module('lmisChromeApp', [
    'ui.bootstrap',
    'ui.router',
    'tv.breadcrumbs',
    'pouchdb',
    'config',
    'nvd3ChartDirectives',
    'angular-growl',
    'ngAnimate',
    'db'
  ])
  .run(function($state, fixtureLoaderService, contactService, growl, pouchStorageService) {
    var initializeContactDB = function() {
      var databases = [contactService.CONTACT_DB];
      return fixtureLoaderService.loadRemoteDB(databases)
        .then(function(res) {
          return fixtureLoaderService.saveDatabases(res);
        });
    };

    //pouchStorageService.destroy('sense_contacts');
    //return;
    $state.go('loadingFixture');

    contactService.all()
      .then(function(contacts) {
        if (contacts.length > 0) {
          $state.go('home.index.home.mainActivity');
        } else {
          initializeContactDB()
            .then(function() {
              $state.go('home.index.home.mainActivity');
            })
            .catch(function(err) {
              console.error(err);
              growl.error('Downloading contacts failed, contact support.');
            });
        }
      })
      .catch(function(error){
        console.log(error);
        growl.error('Error occurred while reading contacts database, contact support.');
      });

  })
  .config(function($compileProvider) {
    // to bypass Chrome app CSP for images.
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(chrome-extension):/);
  })
  .config(function(growlProvider) {
    growlProvider.globalTimeToLive({
      success: 2000,
      error: 5000,
      warning: 2000,
      info: 2000
    });
  });
