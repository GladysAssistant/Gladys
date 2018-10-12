

describe('ParamUser', function() {
  describe('getValues', function() {
    it('should return values', function(done) {
      gladys.paramUser
        .getValues([{ name: 'test', user: 1 }])
        .then(function(values) {
          values.should.be.instanceOf(Array);
          values[0].should.equal('test');
          done();
        })
        .catch(done);
    });
  });
});
