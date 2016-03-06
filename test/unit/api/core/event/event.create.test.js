var should = require('should');
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {

  describe('create', function() {
    
    it('should return event created', function (done) {
     	 
          var event = {
            datetime: '2014-11-03 19:43:37',
            code: 'wakeup',
            user: 1
          };
          
          gladys.event.create(event)
                .then(function(result){
                    validateEvent(result);
                    done();
                }).catch(done);
    });
    
  });

});