var request = require('supertest');

describe('UpdateController', function() {

  describe('updateModes', function() {
    
    it('should update Modes', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/update/mode?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});