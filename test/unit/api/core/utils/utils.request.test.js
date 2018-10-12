

describe('Utils', function() {
  describe('request', function() {
    it('should return error, invalid URL', function(done) {
      gladys.utils
        .request('dkfgjdlkfgjlkdfjgkl')
        .then(function() {
          done('No error detected');
        })
        .catch(function(err) {
          done();
        });
    });
  });
});
