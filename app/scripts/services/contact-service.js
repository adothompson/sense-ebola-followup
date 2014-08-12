'use strict';

angular.module('lmisChromeApp')
  .service('contactService', function ($q, storageService) {
    var CONTACT_DB = 'sense_contacts';

    this.save = function(contact){
      return storageService.save(CONTACT_DB, contact);
    };

    this.get =  function(id){
      return storageService.get(CONTACT_DB, id);
    };

    this.all = function(){
      return storageService.all(CONTACT_DB);
    };

    this.contactGroupedByName = function(){
      var fullNames = {};
      var contact;
      var fullName;
      return this.all()
        .then(function(contacts){
          for(var i in contacts){
            contact  = contacts[i];
            fullName = [contact.Surname, contact.OtherNames].join(' ').toLowerCase();
            fullNames[fullName] = contact;
          }
          return fullNames;
        })
        .catch(function(reason){
          console.error(reason);
          return fullNames;
        });
    };

});
