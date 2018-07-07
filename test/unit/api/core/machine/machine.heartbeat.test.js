var should = require('should');
var validateMachine = require('../../validator/machineValidator.js');

describe('Machine', function() {

  describe('heartbeat', function() {
    
    it('should set the lastSeen to now', function (done) {
          
          gladys.machine.heartbeat({uuid: '73a84d3b-a438-4807-87cc-04896b11e34b'})
                .then((result) => {
                    result.should.have.property('lastSeen');
                    result.lastSeen.should.not.equal('2018-02-11 12:10:43');
                    done();
                }).catch(done);
    });
    
  });

});