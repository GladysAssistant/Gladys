
describe('Calendar', function() {
  describe('getFirstEventTodayUser', function() {
    it('should return first event today user', function(done) {
      gladys.calendar
        .getFirstEventTodayUser(1)
        .then(function(events) {
          done();
        })
        .catch(function(err) {
          if (err.message == 'NotFound') {
            done(); 
          } else {
            done(err); 
          }
        });
    });
  });
});
