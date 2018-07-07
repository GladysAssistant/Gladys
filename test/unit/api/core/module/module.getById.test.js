var should = require('should');
var validateModule = require('../../validator/moduleValidator.js');

describe('Module', function() {

  describe('getById', function() {
    
    it('should module.getById', function (done) {	
          gladys.module.getById({id: 1})
                .then((result) => {
                    validateModule(result);
                    done();
                }).catch(done);
    });
    
  });

});