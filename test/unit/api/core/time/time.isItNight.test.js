var should = require('should');

describe('Time', function() {
  describe('isItNight', function() {
    it('should return true or false', function (done) {
        gladys.time.isItNight({house: 1})
            .then((result) => {
                result.should.be.instanceOf(Boolean);
                done();
            })
            .catch(done);
    });
  });
});