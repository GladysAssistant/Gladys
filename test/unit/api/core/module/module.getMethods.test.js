describe('Module', function() {
  describe('getMethods', function() {
    it('should return the list of methods passed in parameters with a true or false value if they are exposed by the module', function(done) {
      gladys.module
        .getMethods({ module: 'hue', service: 'television', methods: ['setChannel', 'getState'] })
        .then(result => {
          result.should.be.object();
          result.should.have.property('setChannel');
          result.should.have.property('getState');
          result.setChannel.should.be.false();
          result.getState.should.be.false();
          done();
        })
        .catch(done);
    });
  });
});