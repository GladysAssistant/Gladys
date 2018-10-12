
var validateState = require('../../validator/stateValidator.js');

describe('Launcher', function() {
  describe('getStates', function() {
    it('should return all states associated to a specific launcher', function(done) {
      var launcher = {
        id: 1
      };

      gladys.launcher
        .getStates(launcher)
        .then(function(result) {
          validateState(result);
          done();
        })
        .catch(done);
    });
  });
});
