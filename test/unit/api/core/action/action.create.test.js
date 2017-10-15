var should = require('should');
var validateAction = require('../../validator/actionValidator.js');

describe('Action', function() {

  describe('create', function() {
    
    it('should return new action created', function (done) {
     	 
          var action = {
            launcher: 1,
            action: 1,
            params: {
              test: 'test'
            }
          };
          
          gladys.action.create(action)
                .then(function(result){
                    validateAction(result);
                    done();
                }).catch(done);
    });
    
  });

});