
describe('Machine', function() {
  describe('delete', function() {
    it('should delete machine', function(done) {
      var machine = {
        id: 1
      };

      gladys.machine
        .delete(machine)
        .then(function(result) {
          done();
        })
        .catch(done);
    });
  });
});
