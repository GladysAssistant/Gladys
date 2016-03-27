var request = require('supertest');

describe('UpdateController', function() {

  describe('updateSentences', function() {
    
    it.skip('should update Sentences', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/update/sentence?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});