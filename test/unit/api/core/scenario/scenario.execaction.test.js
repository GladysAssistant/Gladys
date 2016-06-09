var should = require('should');

describe('Scenario', function() {

  describe('execAction', function() {
    
    it('should execute action', function (done) {
     	 
          var action = {
              service: 'test',
              function: 'exec',
              id: 1 
          };
          
          gladys.scenario.execAction({actiontype: action, scope: {}})
                .then(function(){
                    done();
                })
                .catch(done);
    });
    
    it('should return error, wrong parameters', function (done) {
     	 
          
          gladys.scenario.execAction({})
                .then(function(){
                    done('No error detected');
                })
                .catch(function(){
                    done();
                });
    });
    
    it('should return error, function does not exist', function (done) {
     	 
          var action = {
              service: 'UnKNOWNSERVICE',
              function: 'thisfunctionwillneverexist',
              id: 1 
          };
          
          gladys.scenario.execAction({actiontype: action, scope: {}})
                .then(function(){
                    done('No error detected');
                })
                .catch(function(){
                    done();
                });
    });
    
  });

});