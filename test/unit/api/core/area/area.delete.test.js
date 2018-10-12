
describe('Area', function() {
  describe('delete', function() {
    it('should delete area', function(done) {
      gladys.area
        .delete({ id: 1 })
        .then(function(result) {
          done();
        })
        .catch(done);
    });
  });
});
