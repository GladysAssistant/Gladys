

describe('StateTypeParam', function() {
  describe('cleanDuplicate', function() {
    it('should cleanDuplicate', function(done) {
      gladys.stateTypeParam
        .cleanDuplicate()
        .then(function() {
          done();
        })
        .catch(done);
    });
  });
});
