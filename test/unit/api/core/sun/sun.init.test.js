

describe('Sun', function() {
  describe('init', function() {
    it('should create two scheduler for sunset and sunrise', function(done) {
      gladys.sun.init().then(function() {
        done();
      });
    });
  });
});
