var request = require('supertest');
var validateUser = require('../../validator/userValidator.js');

describe('UserController', function() {

  describe('update', function() {
    
    it('should update a user', function (done) {
        
        var user = {
             firstname: 'Elon',
             lastname: 'Musk',
         };
        
     	request(sails.hooks.http.app)
        .patch('/user/1?token=test')
        .send(user)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateUser(res.body);
            res.body.should.not.have.property('password');
            res.body.firstname.should.equal(user.firstname);
            done();
        });

    });

    it('should not update a user', function (done) {
        
        var user = {
             firstname: 'Elon',
             lastname: 'Musk',
         };
        
     	request(sails.hooks.http.app)
        .patch('/user/2?token=test')
        .send(user)
        .expect(401)
        .end(function(err, res) {
            if(err) {
                return done();
            }
            
            done('Should not update user');
        });

    });

    it('should not update a password and role user', function (done) {
        
        var user = {
             firstname: 'Elon',
             lastname: 'Musk',
             password: '1',
             role: '12121212'
         };
        
     	request(sails.hooks.http.app)
        .patch('/user/1?token=test')
        .send(user)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            validateUser(res.body);
            res.body.should.not.have.property('password');
            res.body.role.should.equal('admin');
            
            done();
        });

    });
    
  });


});