var request = require('supertest');
var validateAction = require('../../validator/actionValidator.js');

describe('Action', function() {

  describe('delete', function() {
    
    it('should delete an action', function (done) {
        
     	request(sails.hooks.http.app)
        .delete('/action/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});