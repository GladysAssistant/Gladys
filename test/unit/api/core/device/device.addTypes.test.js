var should = require('should');
var validateDevice = require('../../validator/deviceValidator.js');

describe('Device', function() {

  describe('addTypes', function() {
    
    it('should return new DeviceType created', function (done) {
     	var types =  [
                {
                    device: 1,
                    type: 'binary',
                    sensor: false,
                    min: 0,
                    max: 1
                }
        ];  
        
        gladys.device.addTypes(types).then(function(result){
            result.should.be.instanceOf(Array);
            result[0].should.have.property('id');
            done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});