
var validateBoxType = require('../../validator/boxTypeValidator.js');

describe('BoxType', function() {
  describe('getAll', function() {
    it('should return all boxTypes', function(done) {
      gladys.boxType
        .getAll()
        .then(function(result) {
          validateBoxType(result);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
