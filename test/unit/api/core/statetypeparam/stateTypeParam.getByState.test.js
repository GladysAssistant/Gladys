
var validateStateTypeParam = require('../../validator/stateTypeParamValidator.js');

describe('StateTypeParam', function() {
  describe('getByState', function() {
    it('should return StateTypeParam by state', function(done) {
      gladys.stateTypeParam
        .getByStateType({ statetype: 1 })
        .then(function(result) {
          validateStateTypeParam(result);
          result.length.should.not.equal(0);
          done();
        })
        .catch(done);
    });
  });
});
