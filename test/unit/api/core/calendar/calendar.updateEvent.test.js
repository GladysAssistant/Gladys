
var validateCalendarEvent = require('../../validator/calendarEventValidator.js');

describe('Calendar', function() {
  describe('updateEvent', function() {
    it('should update calendarEvent', function(done) {
      var calendarEvent = {
        id: 1,
        name: 'calendar-updated'
      };

      gladys.calendar
        .updateEvent(calendarEvent)
        .then(function(result) {
          validateCalendarEvent(result);
          result.name.should.equal(calendarEvent.name);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
