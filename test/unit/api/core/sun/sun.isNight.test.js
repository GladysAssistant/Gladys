var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('Sun', function() {

  describe('isNight', function() {
    
    it('should return true or false depending on the day time', function (done) {
        
          var options = {
              house: 1
          };
          
          gladys.sun.isNight(options)
                .then(function(result){
                    done();
                }).catch(done);
    });
    
  });

});
