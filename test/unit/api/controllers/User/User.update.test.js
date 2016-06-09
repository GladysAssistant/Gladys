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
            res.body.firstname.should.equal(user.firstname);
            done();
        });

    });
    
  });


});