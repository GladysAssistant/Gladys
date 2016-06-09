var should = require('should');
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {

  describe('getValue', function() {
    
    it('should return value', function (done) {
          
          gladys.param.getValue('quote_of_the_day')
                .then(function(value){
                    value.should.equal('Design is not just what it looks like and feels like. Design is how it works.');
                    done();
                })
                .catch(done);
    });
    
  });

});