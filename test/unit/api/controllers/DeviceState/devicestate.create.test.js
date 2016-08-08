var request = require('supertest');
var validateDeviceState = require('../../validator/deviceStateValidator.js');

describe('DeviceStateController', function() {

  describe('create', function() {
    
    it('should create a device state', function (done) {
        
        var obj = {
            value: 12.2,
            devicetype: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/devicestate?token=test')
        .send(obj)
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateDeviceState(res.body);
            done();
        });

    });

    it('should create a device state', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/devicestate/create?token=test&devicetype=1&value=12.1')
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateDeviceState(res.body);
            done();
        });

    });
    
  });


});