var request = require('supertest');
var validateMachine = require('../../validator/machineValidator.js');

describe('MachineController', function() {

  describe('get', function() {
    
    it('should get all machines', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/machine?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateMachine(res.body);
            done();
        });

    });
    
  });


});