
var validateStateTemplateParam = require('../../validator/stateTemplateParamValidator.js');

describe('StateTemplateParam', function() {
  describe('getByStateType', function() {
    it('should return StateTemplateParam getByStateType', function(done) {
      gladys.stateTemplateParam
        .getByStateType({ statetype: 1 })
        .then(function(result) {
          validateStateTemplateParam(result);
          result.length.should.not.equal(0);
          done();
        })
        .catch(done);
    });
  });
});
