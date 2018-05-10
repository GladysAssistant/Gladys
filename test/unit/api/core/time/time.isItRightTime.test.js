var should = require('should');

describe('Time', function() {
  describe('isItRightTime', function() {
    it('should return true or false', function (done) {
      var options = {
        start: '10:00:00',
        end: '15:00:00'
      };
        gladys.time.isItRightTime(options)
            .then((result) => {
                result.should.be.instanceOf(Boolean);
                done();
            })
            .catch(done);
    });
  });
});
