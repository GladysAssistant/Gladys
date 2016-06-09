var should = require('should');
var validateNotificationUser = require('../../validator/notificationUserValidator.js');

describe('NotificationUser', function() {

  describe('update', function() {
    
    it('should update notificationUsers', function (done) {
     	 
          var notificationUser = {
             id: 1,
             priority: 10
          };
          
          gladys.notificationUser.update(notificationUser)
                .then(function(result){
                    console.log(result);
                    validateNotificationUser(result);
                    result.priority.should.equal(10);
                    done();
                })
                .catch(done);
    });
    
  });

});