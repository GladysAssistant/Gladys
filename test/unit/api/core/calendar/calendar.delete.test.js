
describe('Calendar', function() {
  describe('delete', function() {
    it('should delete calendar', function(done) {
      var calendar = {
        id: 1
      };

      gladys.calendar
        .delete(calendar)
        .then(function(calendar) {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
