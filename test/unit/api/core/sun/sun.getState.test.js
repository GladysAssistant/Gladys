var should = require('should');
var validate = require('../../validator/sunValidator.js');

describe('Sun', function() {

  describe('getState', function() {
    
    it('should return either day or night depending on time', function (done) {
        
          var options = {
              house: 1
          };
          
          gladys.sun.getState(options)
                .then(function(result){
                    validate(result);
                    done();
                }).catch(done);
    });
    
  });

});
