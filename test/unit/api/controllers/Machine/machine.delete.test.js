var request = require('supertest');
var validateMachine = require('../../validator/machineValidator.js');

describe('MachineController', function() {

  describe('delete', function() {
    
    it('should delete a machine', function (done) {

     	request(sails.hooks.http.app)
        .delete('/machine/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});