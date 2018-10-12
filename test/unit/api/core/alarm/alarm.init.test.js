
var validateAlarm = require('../../validator/alarmValidator.js');

describe('Alarm', function() {
  describe('init', function() {
    it('should schedule all alarms', function(done) {
      gladys.alarm
        .init()
        .then(function(alarms) {
          alarms.length.should.not.equal(0);
          validateAlarm(alarms);
          done();
        })
        .catch(done);
    });
  });
});
