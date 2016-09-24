var should = require('should');

describe('DeviceType', function() {

  describe('delete', function() {
    
    it('should delete devicetype', function (done) {
        
        gladys.deviceType.delete({id: 1})
        .then(function(type){      
           done();
        })
        .catch(done);

    });
    
  });

});