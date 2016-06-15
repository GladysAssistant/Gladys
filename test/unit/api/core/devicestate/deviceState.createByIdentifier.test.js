var should = require('should');
var validateDeviceState = require('../../validator/deviceStateValidator.js');

describe('DeviceState', function() {

  describe('createByIdentifier', function() {
    
    it('should return correct deviceState created', function (done) {
     	
        var state = {
            value: 12.1
        };
        
        gladys.deviceState.createByIdentifier('THIS_IS_MY_IDENTIFIER', 'binary', state)
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