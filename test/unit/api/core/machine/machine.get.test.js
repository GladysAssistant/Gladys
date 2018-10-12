
var validateMachine = require('../../validator/machineValidator.js');

describe('Machine', function() {
  describe('get', function() {
    it('should return list of machines', function(done) {
      gladys.machine
        .get()
        .then(function(result) {
          validateMachine(result);
          done();
        })
        .catch(done);
    });
  });
});
