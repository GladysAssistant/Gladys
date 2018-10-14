
var validateMode = require('../../validator/modeValidator.js');

describe('Mode', function() {
  describe('create', function() {
    it('should create mode', function(done) {
      gladys.mode
        .create({ name: 'test', code: 'test', description: 'test this is a test' })
        .then(function(result) {
          validateMode(result);
          done();
        })
        .catch(done);
    });
  });
});
