var request = require('supertest');
var validateMessage = require('../../validator/messageValidator.js');

describe('MessageController', function() {
  describe('GET /message/user/:id', function() {
    it('should get messages with a user', function(done) {
      request(sails.hooks.http.app)
        .get('/message/user/null?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }
          console.log(res.body);
          validateMessage(res.body);

          done();
        });
    });
  });
});
