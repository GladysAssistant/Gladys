
var validateBox = require('../../validator/boxValidator.js');

describe('Box', function() {
  describe('get', function() {
    it('should return list of boxs', function(done) {
      var user = {
        id: 1,
        view: 'dashboard'
      };

      gladys.box
        .get({ user })
        .then(function(result) {
          validateBox(result);
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
