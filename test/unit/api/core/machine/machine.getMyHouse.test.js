
var validateHouse = require('../../validator/houseValidator.js');

describe('Machine', function() {
  describe('getMyHouse', function() {
    it('should return the house where gladys is running', function(done) {
      gladys.machine
        .getMyHouse()
        .then(function(result) {
          validateHouse(result);
          result.id.should.equal(1);
          done();
        })
        .catch(done);
    });
  });
});
