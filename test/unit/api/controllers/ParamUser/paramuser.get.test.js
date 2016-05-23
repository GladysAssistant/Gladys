var request = require('supertest');
var validateParamUser = require('../../validator/paramUserValidator.js');

describe('ParamUser', function() {

  describe('get', function() {
    
    it('should get all paramUsers', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/paramuser?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            res.body.should.be.instanceOf(Array);
            validateParamUser(res.body);
            done();
        });

    });
    
  });


});