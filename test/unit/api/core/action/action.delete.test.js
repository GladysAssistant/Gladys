var should = require('should');
var validateAction = require('../../validator/actionValidator.js');

describe('Action', function() {

  describe('delete', function() {
    
    it('should return delete action', function (done) {
     	 
          var action = {
            id: 1, 
            launcher: 1,
            action: 1
          };
          
          gladys.action.delete(action)
                .then(function(result){
                    done();
                }).catch(done);
    });
    
  });

});