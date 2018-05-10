var should = require('should');

describe('Time', function() {
  describe('isItRightTime', function() {
    it('should return true or false', function (done) {
        gladys.time.isItRightTime({start: '10:00:00', end: '15:00:00'})
            .then((result) => {
                result.should.be.instanceOf(Boolean);
                done();
            })
            .catch(done);
    });
  });
});
