
var validateCalendar = require('../../validator/calendarValidator.js');

describe('Calendar', function() {
  describe('create', function() {
    it('should return calendar created', function(done) {
      var calendar = {
        name: 'Work calendar',
        description: 'I love to work <3',
        externalid: '6b57e5d1-d619-4e56-a358-0978e01573f3',
        user: 1
      };

      gladys.calendar
        .create(calendar)
        .then(function(result) {
          validateCalendar(result);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
