var request = require('supertest');
var validateLauncher = require('../../validator/launcherValidator.js');

describe('LauncherController', function() {

  describe('get', function() {
    
    it('should get launchers', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/launcher?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateLauncher(res.body);
            done();
        });

    });
    
  });


});