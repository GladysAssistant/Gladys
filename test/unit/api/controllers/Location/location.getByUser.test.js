var request = require('supertest');
var validateLocation = require('../../validator/locationValidator.js');

describe('LocationController', function() {

  describe('getByUser', function() {
    
    it('should get locations per user', function (done) {
        
        
     	request(sails.hooks.http.app)
        .get('/user/1/location?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateLocation(res.body);
            done();
        });

    });
    
  });


});