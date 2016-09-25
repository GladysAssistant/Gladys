var request = require('supertest');
var validateMachine = require('../../validator/machineValidator.js');

describe('MachineController', function() {

  describe('update', function() {
    
    it('should update a machine', function (done) {

        var machine = {
            name: 'newName'
        };
        
     	request(sails.hooks.http.app)
        .patch('/machine/1?token=test')
        .send(machine)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateMachine(res.body);
            res.body.name.should.equal(machine.name);
            done();
        });

    });
    
  });


});