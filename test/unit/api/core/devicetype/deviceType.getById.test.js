var should = require('should');
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceType', function() {

  describe('getById', function() {
    
    it('should return a deviceType', function (done) {
        
        var device = {id :  1};
        
        gladys.deviceType.getById(device).then(function(type){
           validateDeviceType(type);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});
