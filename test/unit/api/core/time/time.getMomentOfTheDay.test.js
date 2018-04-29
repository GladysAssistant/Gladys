var should = require('should');

var possibleValues = ['night', 'morning', 'afternoon', 'evening'];

describe('Time', function() {
  describe('getMomentOfTheDay', function() {
    it('should return the moment of the day', function (done) {
        gladys.time.getMomentOfTheDay({house: 1})
            .then((result) => {
                possibleValues.should.containEql(result.state);
                done();
            })
            .catch(done);
    });
  });
});