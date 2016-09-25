var should = require('should');
var validateDeviceState = require('../../validator/deviceStateValidator.js');

describe('DeviceState', function() {

  describe('createByDeviceTypeIdentifier', function() {
    
    it('should return correct deviceState created', function (done) {
     	
        var state = {
            value: 12.1
        };
        
        gladys.deviceState.createByDeviceTypeIdentifier('UNIQUE_IDENTIFIER', 'test', state)
        .then(function(result){
           validateDeviceState(result);
           result.value.should.equal(state.value);
           result.devicetype.should.equal(1);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
    
  });

});