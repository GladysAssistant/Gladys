
var validateCalendarEvent = require('../../validator/calendarEventValidator.js');

describe('Calendar', function() {
  describe('getEvents', function() {
    it('should get list of calendar Events', function(done) {
      var options = {
        user: {
          id: 1
        }
      };

      gladys.calendar
        .getEvents(options)
        .then(function(events) {
          validateCalendarEvent(events);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
