
var validateScript = require('../../validator/scriptValidator.js');

describe('Script', function() {
  describe('create', function() {
    it('should return script created', function(done) {
      var script = {
        name: 'test',
        text: "console.log('My awesome script');",
        user: 1
      };

      gladys.script
        .create(script)
        .then(function(result) {
          validateScript(result);
          done();
        })
        .catch(done);
    });
  });
});
