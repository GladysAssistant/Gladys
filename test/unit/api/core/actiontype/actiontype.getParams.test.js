
var validateActionTypeParam = require('../../validator/actionTypeParamValidator.js');

describe('ActionType', function() {
  describe('getParams', function() {
    it('should return list of actionTypeParams for a specific actionType', function(done) {
      gladys.actionType
        .getParams({ id: 1 })
        .then(function(result) {
          validateActionTypeParam(result);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
