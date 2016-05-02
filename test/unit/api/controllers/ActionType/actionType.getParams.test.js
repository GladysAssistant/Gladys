var request = require('supertest');
var validateActionTypeParam = require('../../validator/actionTypeParamValidator.js');

describe('ActionType', function() {

  describe('getParams', function() {
    
    it('should a valid list of actionTypeParams', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/actiontype/1/params?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body.length.should.not.equal(0);
            validateActionTypeParam(res.body);
            done();
        });

    });
    
  });


});