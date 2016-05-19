var should = require('should');
var validateNotificationType = require('../../validator/notificationTypeValidator.js');

describe('NotificationType', function() {

  describe('get', function() {
    
    it('should get all notificationTypes', function (done) {
     	 
          
          gladys.notificationType.get()
                .then(function(result){
                    validateNotificationType(result);
                    done();
                });
    });
    
  });

});