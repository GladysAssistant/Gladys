
var validateMachine = require('../../validator/machineValidator.js');

describe('Machine', function() {
  describe('create', function() {
    it('should return machine created', function(done) {
      var machine = {
        name: 'Raspberry Pi 3',
        ip: '192.168.1.100',
        house: 1
      };

      gladys.machine
        .create(machine)
        .then(function(result) {
          validateMachine(result);
          done();
        })
        .catch(done);
    });
  });
});
