var should = require('should');

describe('Scenario', function() {

  describe('trigger', function() {
    
    it('should trigger scenario', function (done) {
     	 
          
          gladys.scenario.trigger({code:'test', scope: {}})
                .then(function(result){

                    done();
                })
                .catch(done);
    });
   
    
  });

});