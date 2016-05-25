var should = require('should');
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {

  describe('getValues', function() {
    
    it('should return values', function (done) {
          
          gladys.param.getValues(['quote_of_the_day'])
                .then(function(values){
                    values.should.be.instanceOf(Array);
                    values[0].should.equal('Design is not just what it looks like and feels like. Design is how it works.');
                    done();
                })
                .catch(done);
    });
    
  });

});