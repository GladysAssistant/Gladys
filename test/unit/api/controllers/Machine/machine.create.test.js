var request = require('supertest');
var validateMachine = require('../../validator/machineValidator.js');

describe('MachineController', function() {

  describe('create', function() {
    
    it('should create a machine', function (done) {

        var machine = {
            name: 'trest',
            host: 'http://192.168.1.100',
            house: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/machine?token=test')
        .send(machine)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateMachine(res.body);
            done();
        });

    });
    
  });


});