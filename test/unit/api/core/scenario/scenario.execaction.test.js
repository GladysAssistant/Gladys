var should = require('should');

describe('Scenario', function() {

  describe('execAction', function() {
    
    it('should execute action', function (done) {
     	 
          var action = {
              service: 'TestService',
              function: 'exec',
              id: 1 
          };
          
          gladys.scenario.execAction({actiontype: action, scope: {}})
                .then(function(){
                    done();
                })
                .catch(done);
    });
    
  });

});