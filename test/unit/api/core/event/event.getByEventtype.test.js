var should = require('should');
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {

  describe('getByEventType', function() {
    
    it('should return event by eventtype', function (done) {

        var options = {
            eventtype: 3,
            take: 1,
            skip: 0
          };
          
          gladys.event.getByEventType(options)
            .then(function(result){
                validateEvent(result);
                done();
            }).catch(done);
    });
    
  });

});