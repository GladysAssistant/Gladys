
describe('Device', function() {
  describe('delete', function() {
    it('should delete device', function(done) {
      gladys.device
        .delete({ id: 1 })
        .then(function(device) {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
