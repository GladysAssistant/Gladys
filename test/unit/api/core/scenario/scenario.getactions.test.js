

describe('Scenario', function() {
  describe('getActions', function() {
    it('should get actions and actionParams', function(done) {
      var launcher = {
        id: 1
      };

      gladys.scenario
        .getActions({ launcher: launcher })
        .then(function(actions) {
          actions.should.be.instanceOf(Array);
          actions[0].should.have.property('params');
          done();
        })
        .catch(done);
    });
  });
});
