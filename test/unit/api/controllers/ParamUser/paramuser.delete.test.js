var request = require('supertest');
var validateParamUser = require('../../validator/paramUserValidator.js');

describe('ParamUser', function() {

  describe('delete', function() {
    
    it('should delete a paramUser', function (done) {
        
     	request(sails.hooks.http.app)
        .delete('/param/test?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            
            done();
        });

    });
    
  });


});