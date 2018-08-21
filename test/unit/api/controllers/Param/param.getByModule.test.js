var request = require('supertest');
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {

  describe('getByModule', function() {
    
    it('should get all param', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/module/1/param?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            res.body.should.be.instanceOf(Array);
            validateParam(res.body);
            done();
        });

    });
    
  });


});