

describe('Scenario', function() {
  describe('exec', function() {
    it('should execute a list of actions (Service)', function(done) {
      var obj = {
        launcher: {
          id: 1
        },
        scope: {}
      };

      gladys.scenario
        .exec(obj)
        .then(function(result) {
          done();
        })
        .catch(done);
    });

    it('should execute a list of actions (Gladys core function)', function(done) {
      var obj = {
        launcher: {
          id: 2
        },
        scope: {}
      };

      gladys.scenario
        .exec(obj)
        .then(function(result) {
          done();
        })
        .catch(done);
    });
  });
});
