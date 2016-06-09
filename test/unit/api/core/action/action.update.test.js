var should = require('should');
var validateAction = require('../../validator/actionValidator.js');

describe('Action', function() {

  describe('update', function() {
    
    it('should return action updated', function (done) {
     	 
          var action = {
            id: 1, 
            launcher: 2,
          };
          
          gladys.action.update(action)
                .then(function(result){
                    validateAction(result);
                    result.launcher.should.equal(2);
                    done();
                }).catch(done);
    });
    
  });

});