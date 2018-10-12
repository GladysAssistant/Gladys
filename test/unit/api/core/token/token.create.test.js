

describe('Token', function() {
  describe('create', function() {
    it('should return token created', function(done) {
      var params = {
        name: 'test',
        user: {
          id: 1
        }
      };

      gladys.token
        .create(params)
        .then(function(result) {
          result.should.have.property('value');
          result.should.have.property('user');
          done();
        })
        .catch(done);
    });
  });
});
