var should = require('should');
var validateDevice = require('../../validator/deviceValidator.js');
var validateError = require('../../validator/errorValidator.js');

describe('Device', function() {

  describe('delete', function() {
    
    it('should delete device', function (done) {
        
        gladys.device.delete({id:1}).then(function(device){
           validateDevice(device);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
    it('should return error 404 device not found', function (done) {
        
        gladys.device.delete({id: 2000}).then(function(device){
           
           done('No error detected');
        }).catch(function(err){
            done();
        });

    });
    
    it('should return error', function (done) {
        
        gladys.device.delete({id:'NONSENSE'}).then(function(device){
           
           done('No error detected');
        }).catch(function(err){        
            done();
        });

    });
    
  });

});