

describe('Calendar', function() {
  describe('sync', function() {
    it('should sync calendar services', function(done) {
      gladys.calendar
        .sync()
        .then(function(result) {
          done();
        })
        .catch(done);
    });
  });
});
