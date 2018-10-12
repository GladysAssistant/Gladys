
describe('Calendar', function() {
  describe('deleteEvent', function() {
    it('should delete calendarEvent', function(done) {
      var calendarEvent = {
        id: 1
      };

      gladys.calendar
        .deleteEvent(calendarEvent)
        .then(function() {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
