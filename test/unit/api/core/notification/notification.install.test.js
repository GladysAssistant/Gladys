var should = require('should');
var validateNotification = require('../../validator/notificationValidator.js');

describe('Notification', function() {

  describe('install', function() {
    
    it('should return notificationType created', function (done) {
     	
        var type = {
          service: 'PushBulletService',
          name: 'test'  
        };
        
        gladys.notification.install(type).then(function(result){
           validateNotification(result);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
    it('should return an error, incorrect notificationType', function (done) {
     	var type = {
             
         };
        
        gladys.notification.install(type).then(function(result){
           
           done('No error detected');
        }).catch(function(err){
            done();
        });

    });
    
  });

});