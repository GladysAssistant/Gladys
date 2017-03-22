var should = require('should');
var validateLocation = require('../../validator/locationValidator.js');

describe('Location', function() {

  describe('getUser', function() {
    
    it('should return location of one user', function (done) {
     	 
          gladys.location.getUser({id: 1})
                .then(function(result){
                    result.should.be.instanceOf(Object);
                    validateLocation(result);
                    done();
                }).catch(done);
    });
    
  });

});