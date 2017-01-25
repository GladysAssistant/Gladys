var request = require('supertest');
var validateLocation = require('../../validator/locationValidator.js');

describe('LocationController', function() {

  describe('get', function() {
    
    it('should get locations per user', function (done) {
        
        
     	request(sails.hooks.http.app)
        .get('/location?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateLocation(res.body);
            done();
        });

    });
    
  });


});