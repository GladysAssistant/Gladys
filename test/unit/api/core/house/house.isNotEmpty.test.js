
describe('House', function() {
  describe('isNotEmpty', function() {
    it('should return true, house is not empty', function(done) {
      var options = {
        house: 1
      };

      gladys.house
        .isNotEmpty(options)
        .then(function(result) {
          result.should.equal(true);
          done();
        })
        .catch(done);
    });
  });
});
