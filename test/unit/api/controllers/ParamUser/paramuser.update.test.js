var request = require('supertest');
var validateParamUser = require('../../validator/paramUserValidator.js');

describe('ParamUser', function() {
  describe('update', function() {
    it('should update a param', function(done) {
      var param = {
        value: 'value'
      };

      request(sails.hooks.http.app)
        .patch('/paramuser/test?token=test')
        .send(param)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateParamUser(res.body);
          res.body.value.should.equal(param.value);
          done();
        });
    });
  });
});
