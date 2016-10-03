var should = require('should');
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {

  describe('getById', function() {
    
    it('should return a deviceType by his id', function (done) {
        
        var device = {
          id : 1
        };
        
        gladys.deviceType.getById(device)
          .then(function(type){
            type.should.be.instanceOf(Object);
            validateDeviceType(type);
            done();
          })
          .catch(done);

    });
    
  });

});
