var should = require('should');
var validateModule = require('../../validator/moduleValidator.js');

describe('Module', function() {

  describe('get', function() {
    
    it('should get list of modules installed/or partially installed', function (done) {
     	 
          
          gladys.module.get()
                .then(function(result){
                    
                    validateModule(result);
                    done();
                }).catch(done);
    });
    
  });

});