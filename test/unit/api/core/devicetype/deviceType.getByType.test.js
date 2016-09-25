var should = require('should');
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {

  describe('getByType', function() {
    
    it('should return a deviceType', function (done) {
        
        var type = 'binary';
        
        gladys.deviceType.getByType(type).then(function(type){
           validateDeviceType(type);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});
