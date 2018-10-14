
var validateEventType = require('../../validator/eventTypeValidator.js');

describe('EventType', function() {
  describe('getByCode', function() {
    it('should return eventType by code', function(done) {
      gladys.eventType
        .getByCode({ code: 'test' })
        .then(function(result) {
          validateEventType(result);
          done();
        })
        .catch(done);
    });
  });
});
