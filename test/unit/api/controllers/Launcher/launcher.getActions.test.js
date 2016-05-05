var request = require('supertest');
var validateAction = require('../../validator/actionValidator.js');

describe('LauncherController', function() {

  describe('getActions', function() {
    
    it('should get actions of a specific launcher', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/launcher/1/action?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateAction(res.body);
            done();
        });

    });
    
  });


});