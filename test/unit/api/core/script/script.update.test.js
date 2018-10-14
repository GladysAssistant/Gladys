
var validateScript = require('../../validator/scriptValidator.js');

describe('Script', function() {
  describe('update', function() {
    it('should update script', function(done) {
      var script = {
        id: 1,
        name: 'updated_name'
      };

      gladys.script
        .update(script)
        .then(function(result) {
          validateScript(result);
          result.name.should.equal(script.name);
          done();
        })
        .catch(done);
    });

    it('should return error, script not found', function(done) {
      var script = {
        id: 176823,
        name: 'updated_name'
      };

      gladys.script
        .update(script)
        .then(function(result) {
          done('No error detected');
        })
        .catch(function() {
          done();
        });
    });
  });
});
