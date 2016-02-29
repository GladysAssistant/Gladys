var should = require('should');

describe('Scenario', function() {

  describe('trigger', function() {
    
    it('should trigger scenario', function (done) {
     	 
          
          gladys.scenario.trigger({eventName:'test', scope: {}})
                .then(function(result){

                    done();
                })
                .catch(done);
    });
   
    
  });

});