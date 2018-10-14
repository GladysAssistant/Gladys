
var validateMachine = require('../../validator/machineValidator.js');

describe('Machine', function() {
  describe('update', function() {
    it('should return machine updated', function(done) {
      var machine = {
        id: 1,
        name: 'name-updated'
      };

      gladys.machine
        .update(machine)
        .then(function(result) {
          validateMachine(result);
          result.name.should.equal(machine.name);
          done();
        })
        .catch(done);
    });
  });
});
