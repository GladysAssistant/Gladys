var request = require('supertest');
var validateUser = require('../../validator/userValidator.js');

describe('UserController', function() {

  describe('delete', function() {
    
    it('should delete a user', function (done) {
        
        
     	request(sails.hooks.http.app)
        .delete('/user/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});