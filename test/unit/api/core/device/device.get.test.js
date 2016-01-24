var should = require('should');
var validateDevice = require('../../validator/deviceValidator.js');

describe('Device', function() {

  describe('get', function() {
    
    it('should return list of devices', function (done) {
        
        gladys.device.get().then(function(devices){
           validateDevice(devices);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
    it('should return list of devices (with passed options)', function (done) {
        var options = {
            limit: 20,
            offset: 10
        };
        
        gladys.device.get(options).then(function(devices){
           validateDevice(devices);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
    it('should return an error', function (done) {
        var options = {
            limit: 'This is nonsense, limit should be integer',
            offset: 10
        };
        
        gladys.device.get(options).then(function(devices){
           
           done('No error detected');
        }).catch(function(err){
            done();
        });

    });
    
  });

});