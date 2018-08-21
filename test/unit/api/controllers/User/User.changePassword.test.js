var request = require('supertest');
var validateUser = require('../../validator/userValidator.js');

describe('UserController', function() {

  describe('changePassword', function() {
    
    it('should change password of a user', function (done) {
        
        var params = {
            oldPassword: 'test1234',
            newPassword: 'mynewpassword',
            newPasswordRepeat: 'mynewpassword'
        };
        
     	request(sails.hooks.http.app)
        .patch('/user/1/password?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateUser(res.body);
            res.body.should.not.have.property('password');

            done();
        });

    });

    it('should change password of a user (not my account)', function (done) {
        
        var params = {
            oldPassword: 'test1234',
            newPassword: 'mynewpassword',
            newPasswordRepeat: 'mynewpassword'
        };
        
     	request(sails.hooks.http.app)
        .patch('/user/2/password?token=test')
        .send(params)
        .expect(403)
        .end(function(err, res) {
            if(err) return done(err);

            done();
        });

    });

    
  });


});