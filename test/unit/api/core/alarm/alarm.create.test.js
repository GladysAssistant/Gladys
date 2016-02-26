var should = require('should');
var validateAlarm = require('../../validator/alarmValidator.js');

describe('Alarm', function() {

  describe('create', function() {
    
    it('should return alarm created', function (done) {
     	 
          var alarm = {
            datetime: new Date().toString(),
            user: 1,
            name: 'test'  
          };
          
          gladys.alarm.create(alarm)
                .then(function(alarm){
                    validateAlarm(alarm);
                    done();
                })
                .catch(done);
    });
    
     it('should return alarm with dayofweek created', function (done) {
     	 
          var alarm = {
            dayofweek: 1,
            time: '14:32',
            user: 1,
            name: 'test'  
          };
          
          gladys.alarm.create(alarm)
                .then(function(alarm){
                    validateAlarm(alarm);
                    done();
                })
                .catch(done);
    });
    
    
  });

});