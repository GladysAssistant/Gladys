var should = require('should');

describe('Time', function() {
  describe('isItAM', function() {
    it('should return true or false', function (done) {
        gladys.time.isItAM({house: 1})
            .then((result) => {
                result.should.be.instanceOf(Boolean);
                done();
            })
            .catch(done);
    });
  });
});