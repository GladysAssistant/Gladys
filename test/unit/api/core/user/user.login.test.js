var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('User', function() {

  describe('login', function() {
    
    it('should return user logged in', function (done) {
     	
         var user = {
             email: 'tony.stark@starkindustry.com',
             password: 'test'
         };
        
        gladys.user.login(user)
            .then(function(result){
                validateUser(result);
                result.should.have.property('token');
                result.should.not.have.property('password');
                done();
            }).catch(done);

    });
    
    it('should refuse access, wrong password', function (done) {
     	
         var user = {
             email: 'tony.stark@starkindustry.com',
             password: 'WRONG PASSWORD'
         };
        
        gladys.user.login(user)
            .then(function(result){
                
                done('No error detected');
            }).catch(function(err){
                done();
            });

    });
   
  });

});