var should = require('should');
var validateDevice = require('../../validator/deviceValidator.js');

describe('Device', function() {

  describe('delete', function() {
    
    it.only('should delete device', function (done) {
     	var id = 1;
        
        gladys.device.delete(1).then(function(device){
           validateDevice(device);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});