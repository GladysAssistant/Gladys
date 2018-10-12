
var validateLocation = require('../../validator/locationValidator.js');

describe('Location', function() {
  describe('get', function() {
    it('should return one location per user', function(done) {
      gladys.location
        .get()
        .then(function(result) {
          validateLocation(result);
          done();
        })
        .catch(done);
    });
  });
});
