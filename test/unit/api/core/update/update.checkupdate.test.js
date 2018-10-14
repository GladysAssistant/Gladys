

describe('Update', function() {
  describe('checkUpdate', function() {
    it.skip('should checkUpdate', function(done) {
      gladys.update
        .checkUpdate()
        .then(function() {
          done();
        })
        .catch(done);
    });
  });
});
