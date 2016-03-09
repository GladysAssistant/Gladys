var should = require('should');
var validateDeviceState = require('../../validator/deviceStateValidator.js');
var validateError = require('../../validator/errorValidator.js');

describe('DeviceType', function() {

  describe('exec', function() {
    
    it('should create new DeviceState', function (done) {
        
        var obj = {
            devicetype: 1,
            value: 1  
        };
        
        gladys.deviceType.exec(obj).then(function(state){
           validateDeviceState(state);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
    it('should return error, missing parameter devicetype', function (done) {
        
        var obj = {
            value: 1  
        };
        
        gladys.deviceType.exec(obj).then(function(state){
           
           done('No error detected');
        }).catch(function(err){
            done();
        });

    });
    
    it('should return error 404, deviceType not found', function (done) {
        
        var obj = {
            devicetype: 2798787,
            value: 1  
        };
        
        gladys.deviceType.exec(obj).then(function(state){
           
           done('No error detected');
        }).catch(function(err){
            done();
        });

    });
    
    it('should return error, incorrect value', function (done) {
        
        
        var obj = {
            devicetype: 1,
            value: 120  
        };
        
        gladys.deviceType.exec(obj).then(function(state){
           
           done('No error detected');
        }).catch(function(err){
            done();
        });

    });
   
    
  });

});