var should = require('should');

describe('Scenario', function() {

  describe('verifyConditions', function() {
    
    it('should verify condition (Service Function)', function (done) {
     	 
          var launcher = {
              id: 1 
          };   
          
          gladys.scenario.verifyConditions({launcher:launcher})
                .then(function(result){

                    done();
                })
                .catch(done);
    });
    
    it('should return error, function does not exist', function (done) {
     	 
          var launcher = {
              id: 3
          };   
          
          gladys.scenario.verifyConditions({launcher:launcher})
                .then(function(result){

                    done('No error detected');
                })
                .catch(function(){
                    done();
                });
    });
   
    
  });

});