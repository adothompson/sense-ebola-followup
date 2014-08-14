'use strict';

angular.module('lmisChromeApp')
  .service('contactService', function($q, storageService, syncService, pouchdb, utility) {

    this.CONTACT_DB = 'new_sense';

    this.save = function(contact) {
      return storageService.save(this.CONTACT_DB, contact);
    };

    this.get = function(id) {
      return storageService.get(this.CONTACT_DB, id)
        .then(function(c) {
          return syncService.getSyncStatus(c);
        });
    };

    this.all = function() {
      return storageService.all(this.CONTACT_DB)
        .then(function(contacts) {
          return syncService.addSyncStatus(contacts);
        });
    };

    this.contactGroupedByName = function() {
      var fullNames = {};
      var contact;
      var fullName;
      return this.all()
        .then(function(contacts) {
          for (var i in contacts) {
            contact = contacts[i];
            fullName = [contact.Surname, contact.OtherNames].join(' ').toLowerCase();
            fullNames[fullName] = contact;
          }
          return fullNames;
        })
        .catch(function(reason) {
          console.error(reason);
          return fullNames;
        });
    };

    this.getAllByDeviceId = function(deviceId) {
      var db = pouchdb.create(this.CONTACT_DB);
      var map = function(doc) {
        if (utility.has(doc, 'dailyVisits')
          && angular.isArray(doc.dailyVisits)
          && utility.has(doc, 'deviceId')) {

          emit(doc);

        }
      };
      return db.query({map: map}, {reduce: false});
    };

  });
