var should = require('should');
var validateCalendarEvent = require('../../validator/calendarEventValidator.js');

describe('Calendar', function() {

  describe('createEvent', function() {
    
    it('should return calendarEvent created', function (done) {
     	
         var calendarEvent = {
           name: 'Awesome meeting',
           location: 'Golden Gate bridge, San Fransisco',
           externalid: '001690b3-9e4f-4cee-9c8e-ec934533d2d0',
           start: '2015-05-12 18:00:00',
           end: '2015-05-12 20:00:00',
           calendar: 1  
        };
        
        gladys.calendar.createEvent(calendarEvent).then(function(result){
           validateCalendarEvent(result);
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});