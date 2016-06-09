var request = require('supertest');
var validateState = require('../../validator/stateValidator.js');

describe('LauncherController', function() {

  describe('getStates', function() {
    
    it('should get states of a specific launcher', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/launcher/1/state?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateState(res.body);
            done();
        });

    });
    
  });


});