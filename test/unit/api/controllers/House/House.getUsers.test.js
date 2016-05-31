var request = require('supertest');
var validateUser = require('../../validator/userValidator.js');

describe('HouseController', function() {

  describe('getUsers', function() {
    
    it('should get users in house', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/house/1/user?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            validateUser(res.body);
            done();
        });

    });
    
  });


});