var request = require('supertest');

describe('UpdateController', function() {

  describe('updateboxTypes', function() {
    
    it.skip('should update boxTypes', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/update/box?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});