
var validateCalendar = require('../../validator/calendarValidator.js');

describe('Calendar', function() {
  describe('get', function() {
    it('should get list of calendar', function(done) {
      var options = {
        user: {
          id: 1
        }
      };

      gladys.calendar
        .get(options)
        .then(function(calendars) {
          validateCalendar(calendars);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
