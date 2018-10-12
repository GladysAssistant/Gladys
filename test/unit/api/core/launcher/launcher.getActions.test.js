
var validateAction = require('../../validator/actionValidator.js');

describe('Launcher', function() {
  describe('getActions', function() {
    it('should return all actions associated to a specific launcher', function(done) {
      var launcher = {
        id: 1
      };

      gladys.launcher
        .getActions(launcher)
        .then(function(result) {
          validateAction(result);

          result.forEach(function(action) {
            action.should.have.property('params');
            action.params.forEach(function(param) {
              param.should.be.instanceOf(Object);
            });
          });
          done();
        })
        .catch(done);
    });
  });
});
