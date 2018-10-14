
var validateMode = require('../../validator/modeValidator.js');

describe('Mode', function() {
  describe('get', function() {
    it('should return list of modes', function(done) {
      gladys.mode
        .get()
        .then(function(result) {
          validateMode(result);
          done();
        })
        .catch(done);
    });
  });
});
