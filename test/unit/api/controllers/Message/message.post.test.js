var request = require('supertest');
var validateMessage = require('../../validator/messageValidator.js');

describe('MessageController', function() {
  describe('POST /message', function() {
    it('should send a message', function(done) {
      request(sails.hooks.http.app)
        .post('/message?token=test')
        .send({ text: 'Hi' })
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateMessage(res.body);

          done();
        });
    });
  });
});
