var should = require('should');

describe('DeviceType', function() {

  describe('save', function() {
    
    it('should save new value deviceState', function (done) {
        
        var obj = {
            devicetype: 1,
            value: 2
        };
        
        gladys.deviceType.save(obj).then(function(type){
            
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});