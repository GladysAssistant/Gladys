var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('User', function() {

  describe('resetPassword', function() {
    
    it('should reset password of a user', function (done) {
        
        gladys.user.resetPassword('test1234', '4c7d0b0deadc7ade9c2cecbc9eb8fb74720c2363')
            .then((result) => {
                result.should.be.instanceOf(Object);
                validateUser(result);
                result.should.not.have.property('password');
                done();
            }).catch(done);

    });

    it('should not reset password of a user, password size too low', function (done) {
        
        gladys.user.resetPassword('test', '4c7d0b0deadc7ade9c2cecbc9eb8fb74720c2363')
            .then((result) => {
                done('should have thrown an error');
            })
            .catch((err) => {
                done();
            });

    });
   
  });

});