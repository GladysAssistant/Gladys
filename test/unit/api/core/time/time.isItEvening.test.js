var should = require('should');

describe('Time', function() {
  describe('isItEvening', function() {
    it('should return true or false', function (done) {
        gladys.time.isItEvening({house: 1})
            .then((result) => {
                result.should.be.instanceOf(Boolean);
                done();
            })
            .catch(done);
    });
  });
});