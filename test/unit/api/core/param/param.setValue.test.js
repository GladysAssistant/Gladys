
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {
  describe('setValue', function() {
    it('should return new param created', function(done) {
      var param = {
        name: 'test',
        value: 'Awesome value'
      };

      gladys.param.setValue(param).then(function(param) {
        validateParam(param);
        done();
      });
    });

    it('should return new param updated', function(done) {
      var param = {
        name: 'quote_of_the_day',
        value: 'There are no big problems, there are just a lot of little problems.'
      };

      gladys.param.setValue(param).then(function(param) {
        validateParam(param);
        param.value.should.equal(
          'There are no big problems, there are just a lot of little problems.'
        );
        done();
      });
    });
  });
});
