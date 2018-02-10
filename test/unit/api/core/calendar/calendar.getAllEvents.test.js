var should = require('should');
var validateCalendarEvent = require('../../validator/calendarEventValidator.js');

describe('Calendar', function() {

  describe('getAllEvents', function() {
    
    it('should get list of calendar Events', function (done) {
        
        var options = {
           user: {
               id: 1
           }
        };
        
        gladys.calendar.getAllEvents(options).then(function(events){
           validateCalendarEvent(events);
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});