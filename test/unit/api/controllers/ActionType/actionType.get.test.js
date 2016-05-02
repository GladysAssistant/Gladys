var request = require('supertest');
var validateActionType = require('../../validator/actionTypeValidator.js');

describe('ActionType', function() {

  describe('get', function() {
    
    it('should a valid list of actionTypes', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/actiontype?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body.length.should.not.equal(0);
            validateActionType(res.body);
            done();
        });

    });
    
  });


});