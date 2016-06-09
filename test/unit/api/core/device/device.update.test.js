var should = require('should');
var validateDevice = require('../../validator/deviceValidator.js');
var validateError = require('../../validator/errorValidator.js');

describe('Device', function() {

  describe('update', function() {
    
    it('should return the device updated', function (done) {
     	var device = {
             id: 1,
             name: 'New name'
         };
        
        gladys.device.update(device).then(function(deviceUpdated){
           deviceUpdated.should.have.property('name');
           deviceUpdated.should.have.property('updatedAt');
           deviceUpdated.name.should.equal(device.name);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
    it('should return error 404 Device not found', function (done) {
     	
         var device = {
             id: 13874837489378497,
             name: 'New name'
         };
        
        gladys.device.update(device).then(function(deviceUpdated){
           
           done('No error detected');
        }).catch(function(err){
            done();
        });

    });
    
  });

});