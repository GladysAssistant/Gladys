var should = require('should');

describe('DeviceType', function() {

  describe('create', function() {
    
    it('should create new deviceType', function (done) {
        
        var obj = {
            device: 1,
            type: 'binary',
            min: 0,
            max: 1,
            sensor: false
        };
        
        gladys.deviceType.create(obj).then(function(type){
            
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});