var request = require('supertest');
var validateMode = require('../../validator/modeValidator.js');

describe('ModeController', function() {

  describe('delete', function() {
    
    it('should delete a mode', function (done) {
        
     	request(sails.hooks.http.app)
        .delete('/mode/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});