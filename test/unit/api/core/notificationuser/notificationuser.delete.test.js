var should = require('should');
var validateNotificationUser = require('../../validator/notificationUserValidator.js');

describe('NotificationUser', function() {

  describe('delete', function() {
    
    it('should delete notificationUser', function (done) {
     	 
          var notificationUser = {
             id: 1
          };
          
          gladys.notificationUser.delete(notificationUser)
                .then(function(result){
                    done();
                });
    });
    
  });

});