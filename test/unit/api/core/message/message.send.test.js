
var validateMessage = require('../../validator/messageValidator.js');

describe('Message', function() {
  describe('send', function() {
    it('should send a message to gladys', function(done) {
      gladys.message
        .send({ id: 1, language: 'en' }, { text: 'What time is it ?' })
        .then(function(result) {
          validateMessage(result);
          done();
        })
        .catch(done);
    });
  });
});
