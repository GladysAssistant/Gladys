var should = require('should');
var eventTypeValidator = require('../../validator/eventTypeValidator.js');

describe('Event', function() {

  describe('addType', function() {
    
    it('should return new eventType created', function (done) {
     	 
          var eventType = {
              code: 'newtype',
              name: 'awesome type'
          };
          
          gladys.event.addType(eventType)
                .then(function(result){
                    eventTypeValidator(result);
                    done();
                });
    });
    
  });

});