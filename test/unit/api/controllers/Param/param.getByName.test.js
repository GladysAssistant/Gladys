var request = require('supertest');

describe('Param', function() {

  describe('getByName', function() {
    
    it('should get a param by name', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/param/USER_TIME_BEFORE_CONSIDERING_LEFT_HOME?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            res.body.should.have.property('value', '20')
            done();
        });

    });
    
  });


});