var should = require('should');
var validateState = require('../../validator/stateValidator.js');

describe('State', function() {

  describe('create', function() {
    
    it('should create state', function (done) {
     	
        var state = {
            state: 1,
            condition_template: 'true',
            launcher: 1,
            active: 1,
            params: {
                test: 'toto'       
            }
        };
        
        gladys.state.create(state)
            .then(function(result){
                
                validateState(result);
                done();
            }).catch(done);

    });
   
  });

});