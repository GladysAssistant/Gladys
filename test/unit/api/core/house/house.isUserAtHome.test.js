

describe('House', function() {
  describe('isUserAtHome', function() {
    it('should return true, user is at home', function(done) {
      var options = {
        house: 1,
        user: 1
      };

      gladys.house
        .isUserAtHome(options)
        .then(function(result) {
          result.should.equal(true);
          done();
        })
        .catch(done);
    });

    it('should return false, user is not at home', function(done) {
      var options = {
        house: 1,
        user: 2
      };

      gladys.house
        .isUserAtHome(options)
        .then(function(result) {
          result.should.equal(false);
          done();
        })
        .catch(done);
    });
  });
});
