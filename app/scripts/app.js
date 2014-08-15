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
  .run(function($state, fixtureLoaderService, contactService, growl) {

    var initializeContactDB = function() {
      var databases = [contactService.CONTACT_DB];
      return fixtureLoaderService.loadRemoteDB(databases)
        .then(function(res) {
          return fixtureLoaderService.saveDatabases(res);
        });
    };

    var updateContactListAndGoHome = function() {
      contactService.updateFromRemote()
        .then(function() {
          growl.success('Contact list updated successfully.');
        })
        .then(function(err) {
          if(typeof err !== 'undefined'){
            growl.error('Contact list update failed, check your internet connection or contact support.');
          }
          console.error(err);
        })
        .finally(function() {
          $state.go('home.index.home.mainActivity');
        });
    };

    $state.go('loadingFixture');

    contactService.all()
      .then(function(contacts) {
        if (contacts.length > 0) {
          updateContactListAndGoHome();
        } else {
          initializeContactDB()
            .then(function() {
              $state.go('home.index.home.mainActivity');
            })
            .catch(function() {
              // FIXME: Try to reinit as auth call deterministically fails
              // on the first try.
              initializeContactDB()
                .then(function() {
                  $state.go('home.index.home.mainActivity');
                })
                .catch(function(err) {
                  console.error(err);
                  growl.error('Downloading contacts failed, contact support.');
                });
            });
        }
      })
      .catch(function(error) {
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
      success: 10000,
      error: 15000,
      warning: 20000,
      info: 20000
    });
  });
