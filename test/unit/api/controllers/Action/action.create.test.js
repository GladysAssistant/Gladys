var request = require('supertest');
var validateAction = require('../../validator/actionValidator.js');

describe('Action', function() {
  describe('create', function() {
    it('should create an action', function(done) {
      var action = {
        launcher: 1,
        action: 1
      };

      request(sails.hooks.http.app)
        .post('/action?token=test')
        .send(action)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateAction(res.body);
          done();
        });
    });
  });
});
