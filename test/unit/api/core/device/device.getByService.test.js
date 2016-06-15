var should = require('should');
var validateDevice = require('../../validator/deviceValidator.js');

describe('Device', function() {

  describe('getByService', function() {
    
    it('should return list of devices', function (done) {
        
        gladys.device.getByService({service:'test'})
            .then(function(devices){
                validateDevice(devices);
                devices.forEach(function(device){
                    device.service.should.equal('test');
                });
                done();
            }).catch(function(err){
                done(err);
            });

    });
    
  });

});