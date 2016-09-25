var should = require('should');
var validateDeviceState = require('../../validator/deviceStateValidator.js');
var validateError = require('../../validator/errorValidator.js');

describe('DeviceType', function() {

  describe('getByTag', function() {
    
    it('should get all DeviceType with State for the given device tag', function (done) {
        
        var tag = 'light';
        
        gladys.deviceType.getbyTag(tag).then(function(state){
           validateDeviceState(state)
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});
