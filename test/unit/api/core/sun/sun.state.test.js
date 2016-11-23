var should = require('should');
var validateSunState = require('../../validator/sunStateValidator.js');

describe('Sun', function() {

  describe('state', function() {
    
    it('should return either day or night depending on time', function (done) {
        
          var options = {
              house: 1
          };
          
          gladys.sun.state(options)
                .then(function(result){
                    validateSunState(result);
                    done();
                }).catch(done);
    });
    
  });

});
