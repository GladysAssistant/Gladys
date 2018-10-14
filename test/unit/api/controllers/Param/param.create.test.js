var request = require('supertest');
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {
  describe('create', function() {
    it('should create a param', function(done) {
      var param = {
        name: 'THIS_IS_A_TEST',
        value: 'value'
      };

      request(sails.hooks.http.app)
        .post('/param?token=test')
        .send(param)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateParam(res.body);
          done();
        });
    });
  });
});
