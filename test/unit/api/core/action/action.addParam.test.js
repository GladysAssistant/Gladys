var should = require('should');
var validateActionParam = require('../../validator/actionParamValidator.js');

describe('Action', function() {

  describe('addParam', function() {
    
    it('should return addParam to an action', function (done) {
     	 
          var param = {
            action: 1,
            actiontypeparam: 1,
            value: 12
          };
          
          gladys.action.addParam(param)
                .then(function(result){
                    validateActionParam(result);
                    done();
                }).catch(done);
    });
    
  });

});