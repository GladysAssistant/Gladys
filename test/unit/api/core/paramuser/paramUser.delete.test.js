var should = require('should');
var validateParam = require('../../validator/paramValidator.js');

describe('ParamUser', function() {

  describe('delete', function() {
    
    it('should delete value', function (done) {
          
          gladys.param.delete({name: 'test', user: 1})
                .then(function(){
                    
                    done();
                });
    });
    
  });

});