
var validateArea = require('../../validator/areaValidator.js');

describe('Area', function() {
  describe('getAll', function() {
    it('should get all areas', function(done) {
      gladys.area
        .getAll()
        .then(function(result) {
          validateArea(result);
          done();
        })
        .catch(done);
    });
  });
});
