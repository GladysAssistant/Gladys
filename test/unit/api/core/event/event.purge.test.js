var should = require('should');
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {

  describe('purge', function() {
    
    it('should return 5 events ', function (done) {
     	
        var event = {
            params: {
                eventtype : 3,
                value: 1,
                datetime: new Date()
            }
        };
        
        gladys.event.create(event)
        .then(function(result){

           var options = {
             evnettype : 3,
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
