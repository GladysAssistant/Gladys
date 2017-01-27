var request = require('supertest');

describe('WeatherController', function() {

  describe('get', function() {
    
    it('should get weather', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/weather?token=test&latitude=45&longitude=12')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            res.body.should.have.property('temperature');
            done();
        });

    });
    
  });


});