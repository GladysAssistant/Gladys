var request = require('supertest');
var validateUser = require('../../validator/userValidator.js');

describe('UserController', function() {

  describe('seen', function() {
    
    it('should mark user as seen', function (done) {
        
     	request(sails.hooks.http.app)
        .post('/user/1/house/1/seen?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            res.body.should.have.property('user', 1);
            res.body.should.have.property('house', 1);
            done();
        });

    });
    
  });


});