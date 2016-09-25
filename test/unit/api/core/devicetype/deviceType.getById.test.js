var should = require('should');
var validateDeviceState = require('../../validator/deviceStateValidator.js');
var validateError = require('../../validator/errorValidator.js');

describe('DeviceType', function() {

  describe('getById', function() {
    
    it('should get DeviceType with State for the given Id', function (done) {
        
        var id = 1;
        
        gladys.deviceType.getbyId(id).then(function(state){
           validateDeviceState(state)
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});
