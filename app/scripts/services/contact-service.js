'use strict';

angular.module('lmisChromeApp')
  .service('contactService', function($q, storageService, syncService, config, pouchStorageService, utility) {
    var DB_NAME = 'new_sense';
    this.CONTACT_DB = DB_NAME;

    var saveContact = function(contact, updateLastModified) {
      return storageService.save(DB_NAME, contact, updateLastModified);
    };

    this.save = function(contact) {
      return saveContact(contact);
    };

    this.get = function(id) {
      return storageService.get(DB_NAME, id)
        .then(function(c) {
          return syncService.getSyncStatus(c);
        });
    };

    this.all = function() {
      return storageService.all(DB_NAME)
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

    var mergeContact = function(localCopy, remoteCopy) {
      var updatedObject;
      if (utility.has(localCopy, 'dailyVisits') && utility.has(remoteCopy, 'dailyVisits')) {
        var dailyVisit = [];
        if (!angular.isArray(localCopy.dailyVisits)) {
          localCopy.dailyVisits = [];
        }
        if (!angular.isArray(remoteCopy.dailyVisits)) {
          remoteCopy.dailyVisits = [];
        }
        var remoteContactVisits = utility.castArrayToObject(remoteCopy.dailyVisits, 'dateOfVisit');
        var localContactVisits = utility.castArrayToObject(localCopy.dailyVisits, 'dateOfVisit');
        var localDV;
        for (var key in remoteContactVisits) {
          localDV = localContactVisits[key];
          if (angular.isObject(localDV)) {
            dailyVisit.push(localDV);
          } else {
            dailyVisit.push(remoteContactVisits[key]);
          }
        }
        remoteCopy.dailyVisits = dailyVisit;
        updatedObject = angular.copy(remoteCopy);
      } else {
        updatedObject = angular.copy(remoteCopy);
      }
      return updatedObject;
    };

    var mergedContactList = function(localContactsObj, remoteContactsObj) {

      var alreadyUpdatedContacts = [];
      var toBeUpdatedContactIds = [];
      var c;
      for (var k in remoteContactsObj) {
        c = localContactsObj[k];
        if (angular.isObject(c)) {
          toBeUpdatedContactIds.push(c._id);
        } else {
          c = remoteContactsObj[k];
          alreadyUpdatedContacts.push(c);
        }
      }

      var idToBeUpdated;
      var mergedContact;
      for (var index in toBeUpdatedContactIds) {
        idToBeUpdated = toBeUpdatedContactIds[index];
        mergedContact = mergeContact(localContactsObj[idToBeUpdated], remoteContactsObj[idToBeUpdated]);
        alreadyUpdatedContacts.push(mergedContact);
      }
      return alreadyUpdatedContacts;
    };

    var getRemoteContactsObj = function(res) {
      var contactObj = {};
      var row;
      for (var i in res) {
        row = res[i];
        contactObj[row.id] = row.doc;
      }
      return contactObj;
    };

    this.updateFromRemote = function() {
      var db = pouchStorageService.getRemoteDB(DB_NAME);
      var alreadyUpdatedContacts = [];
      var dbName = DB_NAME;
      var promises = [];
      return db.login(config.api.username, config.api.password)
        .then(function() {
          return $q.all([db.allDocs({ include_docs: true }), storageService.all(dbName)])
            .then(function(res) {
              var remoteContactsObj = getRemoteContactsObj(res[0].rows);
              var localContactsObj = utility.castArrayToObject(res[1], '_id');
              alreadyUpdatedContacts = mergedContactList(localContactsObj, remoteContactsObj);
              var contact;
              for (var i in alreadyUpdatedContacts) {
                contact = alreadyUpdatedContacts[i];
                if (!angular.isObject(contact)) {
                  console.error('Contact is not an object: ' + JSON.stringify(contact));
                  continue;
                }
                promises.push(storageService.add(DB_NAME, contact));
              }
              console.log(alreadyUpdatedContacts.length);
              return $q.all(promises);
            });
        });
    };

  });
