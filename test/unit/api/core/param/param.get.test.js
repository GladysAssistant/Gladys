var should = require('should');
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {

  describe('get', function() {
    
    it('should get all value', function (done) {
          
          gladys.param.get()
                .then(function(params){
                    validateParam(params);
                    done();
                });
    });
    
  });

});