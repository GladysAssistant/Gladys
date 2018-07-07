var should = require('should');
var validateModule = require('../../validator/moduleValidator.js');

describe('Module', function() {

  describe('get', function() {
    
    it('should get list of modules installed/or partially installed', function (done) {
     	    
          gladys.module.get()
                .then((result) => {
                    validateModule(result);
                    result.forEach((module) => {
                      module.should.have.property('machineName');
                    });
                    done();
                })
                .catch(done);
    });
    
  });

});