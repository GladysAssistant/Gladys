var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('User', function() {

  describe('create', function() {
    
    it('should return user created', function (done) {
     	
         var user = {
             firstname: 'Elon',
             lastname: 'Musk',
             email: 'elon.musk@tesla.com',
             birthdate: '1971-06-28',
             language: 'en-US',
             password: 'tesla123',
             gender: 1
         };
        
        gladys.user.create(user)
            .then(function(result){
                validateUser(result);
                result.should.have.property('token');
                result.should.not.have.property('password');
                done();
            }).catch(done);

    });
   
  });

});