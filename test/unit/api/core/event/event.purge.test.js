var should = require('should');
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {

  describe('purge', function() {
    
    it('should return 3 events ', function (done) {
     	
        var event = {
            params: {
                eventtype : 3,
                value: 1,
                datetime: new Date(),
                user: 1
            }
        };
        
        gladys.event.create(event)
        .then(function(result){

           var options = {
             eventtype : 3,
             days : 1,
             value: 1
           }

           return gladys.event.purge(options);
        })
        .then(function() {

           return gladys.event.get({user: 1});
        })
        .then(function(result){
           validateEvent(result);
           result.should.be.instanceof(Array);
           result.should.have.length(3);
           done();
        })
        .catch(done)
    });
  });
});
