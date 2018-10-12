

describe('Brain', function() {
  describe('save', function() {
    it('should save the brain ', function(done) {
      gladys.brain
        .save()
        .then(function(result) {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
