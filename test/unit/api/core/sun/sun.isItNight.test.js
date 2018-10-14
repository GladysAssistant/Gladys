

describe('Sun', function() {
  describe('isItNight', function() {
    it('should return true or false depending the time', function(done) {
      var options = {
        house: 1
      };

      gladys.sun
        .isItNight(options)
        .then(function(result) {
          result.should.be.a.Boolean; // eslint-disable-line
          done();
        })
        .catch(done);
    });
  });
});
