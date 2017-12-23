var should = require('should');
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {

  describe('purge', function() {
    
    it('should return 5 events', function (done) {
     	
        var event = {
            eventtype : 9,
            value: 1,
            user: 1,
            datetime: new Date()
        };
        
        gladys.event.create(event)
        .then(function(result){

           var options = {
             evnettype : 9,
             days : 1,
             value: 1
           }

           return gladys.event.purge(options);
        })
        .then(function() {

           return gladys.event.get();
        })
        .then(function(result){
           validateEvent(result);
           result.should.be.instanceof(Array);
           result.should.have.length(5);
           done();
        })
        .catch(done)
    });
  });
});
