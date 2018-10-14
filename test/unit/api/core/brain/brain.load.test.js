

describe('Brain', function() {
  describe('load', function() {
    it.skip('should load the brain ', function(done) {
      gladys.brain
        .load()
        .then(function(result) {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
