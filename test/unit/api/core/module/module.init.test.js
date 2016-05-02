var should = require('should');
var validateModule = require('../../validator/moduleValidator.js');

describe('Module', function() {

  describe('init', function() {
    
    it('should install all modules not fully installed', function (done) {
     	  
          gladys.module.init()
                .then(function(result){
                    validateModule(result);
                    result.forEach(function(module){
                        module.status.should.equal(0);
                    });
                    done();
                }).catch(done);
    });
    
  });

});