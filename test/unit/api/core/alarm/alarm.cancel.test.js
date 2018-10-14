
var validateAlarm = require('../../validator/alarmValidator.js');

describe('Alarm', function() {
  describe('cancel', function() {
    it('should return alarm cancelled', function(done) {
      gladys.alarm
        .create({ name: 'test', dayofweek: 1, time: '12:00', user: 1 })
        .then(function(alarm) {
          return gladys.alarm.cancel(alarm);
        })
        .then(function(alarm) {
          validateAlarm(alarm);
          done();
        })
        .catch(done);
    });
  });
});
