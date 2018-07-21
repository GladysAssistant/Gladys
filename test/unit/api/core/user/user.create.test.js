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
             password: 'tesla123456789',
             gender: 1,
             role: 'admin'
         };
        
        gladys.user.create(user)
            .then(function(result){
                validateUser(result);
                result.should.have.property('token');
                result.should.not.have.property('password');
                done();
            }).catch(done);

    });

    it('should return error, password size too low', function (done) {
     	
        var user = {
            firstname: 'Elon',
            lastname: 'Musk',
            email: 'elon.musk@tesla.com',
            birthdate: '1971-06-28',
            language: 'en-US',
            password: '12456',
            gender: 1,
            role: 'admin'
        };
       
       gladys.user.create(user)
           .then((result) => {
                done('Should have returned an error');
           })
           .catch((err) => {
               err.message.should.equal('PASSWORD_SIZE_TOO_LOW');
               done();
           })
           .catch(done);
   });
   
  });

});