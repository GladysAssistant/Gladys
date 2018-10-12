
describe('Mode', function() {
  describe('delete', function() {
    it('should delete mode', function(done) {
      gladys.mode
        .delete({ id: 1 })
        .then(function(result) {
          done();
        })
        .catch(done);
    });
  });
});
