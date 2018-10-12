
var validateScript = require('../../validator/scriptValidator.js');

describe('Script', function() {
  describe('getById', function() {
    it('should return a script', function(done) {
      var script = {
        id: 1
      };

      gladys.script
        .getById(script)
        .then(function(result) {
          validateScript(result);
          done();
        })
        .catch(done);
    });

    it('should return error, script not found', function(done) {
      var script = {
        id: 12222
      };

      gladys.script
        .getById(script)
        .then(function(result) {
          done('No error detected');
        })
        .catch(function() {
          done();
        });
    });

    it('should return error, wrong parameters', function(done) {
      gladys.script
        .getById()
        .then(function(result) {
          done('No error detected');
        })
        .catch(function() {
          done();
        });
    });
  });
});
