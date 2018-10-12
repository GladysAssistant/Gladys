
var validateActionTypeParam = require('../../validator/actionTypeParamValidator.js');

describe('ActionType', function() {
  describe('addParams', function() {
    it('should modify existing params', function(done) {
      gladys.actionType
        .addParams(1, [
          {
            name: 'modified',
            path: '/house',
            variablename: 'houseId'
          }
        ])
        .then(function(result) {
          validateActionTypeParam(result);
          result[0].name.should.equal('modified');
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
