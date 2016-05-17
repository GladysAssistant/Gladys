var request = require('supertest');
var validateEvent = require('../../validator/eventValidator.js');

describe('ModeController', function() {

  describe('change', function() {
    
    it('should change a house mode', function (done) {
        
        var params = {
            mode: 'at-home'
        };
        
     	request(sails.hooks.http.app)
        .post('/house/1/mode?token=test')
        .send(params)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateEvent(res.body);
            done();
        });

    });
    
  });


});