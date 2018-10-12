
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {
  describe('update', function() {
    it('should return event updated', function(done) {
      var event = {
        datetime: '2014-11-03 19:43:37',
        id: 1,
        user: 1
      };

      gladys.event
        .update(event)
        .then(function(result) {
          validateEvent(result);
          result.should.have.property('datetime', event.datetime);
          done();
        })
        .catch(done);
    });
  });
});
