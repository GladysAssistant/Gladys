var should = require('should');
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {

  describe('getByModule', function() {
    
    it('should get all values from a module', function (done) {
          gladys.param.getByModule({id: 1})
                .then((params) => {
                    validateParam(params);
                    done();
                })
                .catch(done);
    });
    
  });

});