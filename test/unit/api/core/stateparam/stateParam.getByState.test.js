
var validateStateParam = require('../../validator/stateParamValidator.js');

describe('StateParam', function() {
  describe('getByState', function() {
    it('should return stateParam getByState', function(done) {
      gladys.stateParam
        .getByState({ state: 1 })
        .then(function(result) {
          validateStateParam(result);
          result.length.should.not.equal(0);
          done();
        })
        .catch(done);
    });
  });
});
