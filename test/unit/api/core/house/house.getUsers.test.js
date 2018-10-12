
var validateUser = require('../../validator/userValidator.js');

describe('House', function() {
  describe('getUsers', function() {
    it('should return list of users in house', function(done) {
      var options = {
        house: 1
      };

      gladys.house
        .getUsers(options)
        .then(function(result) {
          result.length.should.equal(1);
          validateUser(result);
          result[0].id.should.equal(1);
          done();
        })
        .catch(done);
    });
  });
});
