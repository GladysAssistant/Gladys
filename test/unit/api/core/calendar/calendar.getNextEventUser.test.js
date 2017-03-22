var should = require('should');
var validateCalendarEvent = require('../../validator/calendarEventValidator.js');

describe('Calendar', function() {

  describe('getNextEventUser', function() {
    
    it('should get next event of a user', function (done) {
        
        var user = {
            id: 1
        };
        
        gladys.calendar.getNextEventUser(user).then(function(events){
           validateCalendarEvent(events);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});