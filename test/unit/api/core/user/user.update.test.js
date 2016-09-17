var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('User', function() {

  describe('update', function() {
    
    it('should return user updated', function (done) {
     	
         var user = {
             id: 1,
             lastname: 'My New LastName'
         };
        
        gladys.user.update(user)
            .then(function(result){
                validateUser(result);
                result.should.have.property('lastname');
                result.lastname.should.equal(user.lastname);
                done();
            }).catch(done);

    });
   
  });

});