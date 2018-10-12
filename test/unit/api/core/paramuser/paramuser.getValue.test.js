
describe('ParamUser', function() {
  describe('getValue', function() {
    it('should return value', function(done) {
      gladys.paramUser
        .getValue('test', 1)
        .then(function(value) {
          value.should.equal('test');
          done();
        })
        .catch(done);
    });
  });
});
