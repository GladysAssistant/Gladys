var should = require('should');
var validateAlarm = require('../../validator/alarmValidator.js');

describe('Alarm', function() {

  describe('update', function() {
    
    it('should return alarm updated', function (done) {
     	 
          var alarm = {
            name:'updated_name'
          };
          
          
          
          gladys.alarm.update({id: 1, alarm: alarm})
                .then(function(newAlarm){
                    validateAlarm(newAlarm);
                    newAlarm.name.should.equal(alarm.name);
                    done();
                })
                .catch(done);
    });
    
    it('should return alarm updated and cancel it', function (done) {
     	 
          var alarm = {
            name:'updated_name',
            active: false
          };
          
          
          
          gladys.alarm.update({id: 1, alarm: alarm})
                .then(function(newAlarm){
                    validateAlarm(newAlarm);
                    newAlarm.name.should.equal(alarm.name);
                    done();
                })
                .catch(done);
    });
    
    it('should return error, alarm not found', function (done) {
     	 
          var alarm = {
            name:'updated_name',
            active: false
          };
          
          
          
          gladys.alarm.update({id: 173676374, alarm: alarm})
                .then(function(newAlarm){
                    
                    done('no error detected');
                })
                .catch(function(){
                    done();
                });
    });
    
    
  });

});