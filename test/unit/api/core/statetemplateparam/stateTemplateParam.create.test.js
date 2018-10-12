
var validateStateTemplateParam = require('../../validator/stateTemplateParamValidator.js');

describe('StateTemplateParam', function() {
  describe('create', function() {
    it('should return StateTemplateParam created', function(done) {
      var stateTemplateParam = {
        variablename: 'test',
        name: 'test',
        statetype: 1
      };

      gladys.stateTemplateParam
        .create(stateTemplateParam)
        .then(function(result) {
          validateStateTemplateParam(result);
          done();
        })
        .catch(done);
    });
  });
});
