var should = require('should');
var validateUser = require('../../validator/userValidator.js');

describe('User', function() {

  describe('changePassword', function() {
    
    it('should changePassword', function (done) {

        var params = {
            id: 1,
            oldPassword: 'test1234',
            newPassword: 'mynewpassword',
            newPasswordRepeat: 'mynewpassword'
        };
        
        gladys.user.changePassword(params)
            .then((result) => {
                validateUser(result);
                done();
            }).catch(done);

    });
    
    it('should refuse access, wrong password', function (done) {

        var params = {
            id: 1,
            oldPassword: 'wrongpassword',
            newPassword: 'mynewpassword',
            newPasswordRepeat: 'mynewpassword'
        };
     	
        gladys.user.changePassword(params)
            .then((result) => {
                done('should return an error');
            })
            .catch((err) => {
                err.message.should.equal('OLD_PASSWORD_INVALID');
                done();
            })
            .catch(done);

    });

    it('should not change passsword, password too short', function (done) {

        var params = {
            id: 1,
            oldPassword: 'test1234',
            newPassword: 'little',
            newPasswordRepeat: 'little'
        };
     	
        gladys.user.changePassword(params)
            .then((result) => {
                done('should return an error');
            })
            .catch((err) => {
                err.message.should.equal('PASSWORD_SIZE_TOO_LOW');
                done();
            })
            .catch(done);

    });

    it('should not change passsword, two password are not matching', function (done) {

        var params = {
            id: 1,
            oldPassword: 'test1234',
            newPassword: 'sdfsdfsdfs',
            newPasswordRepeat: 'mynewpassword'
        };
     	
        gladys.user.changePassword(params)
            .then((result) => {
                done('should return an error');
            })
            .catch((err) => {
                err.message.should.equal('PASSWORD_DOES_NOT_MATCH');
                done();
            })
            .catch(done);

    });
   
  });

});