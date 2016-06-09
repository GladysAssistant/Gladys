var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('House', function() {

  describe('isEmpty', function() {
    
    it('should return false, house is not empty', function (done) {
        
          var options = {
              house: 1
          };
          
          gladys.house.isEmpty(options)
                .then(function(result){
                    result.should.equal(false);
                    done();
                }).catch(done);
    });
    
  });

});