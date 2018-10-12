var request = require('supertest');
var validateState = require('../../validator/stateValidator.js');

describe('State', function() {
  describe('create', function() {
    it('should create a state', function(done) {
      var state = {
        state: 1,
        launcher: 1
      };

      request(sails.hooks.http.app)
        .post('/state?token=test')
        .send(state)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateState(res.body);
          done();
        });
    });
  });
});
