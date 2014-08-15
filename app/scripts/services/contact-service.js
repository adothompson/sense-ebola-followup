'use strict';

angular.module('lmisChromeApp')
  .service('contactService', function($q, storageService, syncService, pouchdb, utility) {

    this.CONTACT_DB = 'sense_contacts';

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
      return this.all()
        .then(function(contacts) {
          var dailyVisitsByDevice = [];
          var dailyVisit;
          var res;
          for (var i in contacts) {
            var contact = contacts[i];
            if (utility.has(contact, 'dailyVisits') && angular.isArray(contact.dailyVisits)) {
              for (var i in contact.dailyVisits) {
                dailyVisit = contact.dailyVisits[i];
                if (utility.has(dailyVisit, 'deviceId') && dailyVisit.deviceId === deviceId) {
                  res = { contact: contact, dateOfVisit: dailyVisit.dateOfVisit };
                  dailyVisitsByDevice.push(res);
                }
              }
            }
          }
          return dailyVisitsByDevice;
        });
    };

  });
