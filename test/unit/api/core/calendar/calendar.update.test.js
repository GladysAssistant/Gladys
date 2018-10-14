
var validateCalendar = require('../../validator/calendarValidator.js');

describe('Calendar', function() {
  describe('update', function() {
    it('should update calendar', function(done) {
      var calendar = {
        id: 1,
        name: 'calendar-updated'
      };

      gladys.calendar
        .update(calendar)
        .then(function(result) {
          validateCalendar(result);
          result.name.should.equal(calendar.name);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
