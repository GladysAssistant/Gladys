
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {
  describe('purgeByEventType', function() {
    it('should return 6 events', function(done) {
      var event = {
        params: {
          eventtype: 3,
          value: 1,
          user: 1,
          datetime: new Date()
        }
      };

      gladys.event
        .create(event)
        .then(function(result) {
          var options = {
            days: 1,
            eventtype: 'devicetype-new-value'
          };

          return gladys.event.purgeByEventType(options);
        })
        .then(function() {
          return gladys.event.get({
            user: {
              id: 1
            }
          });
        })
        .then(function(result) {
          validateEvent(result);
          result.should.be.instanceof(Array);
          result.should.have.length(6);
          done();
        })
        .catch(done);
    });
  });
});
