
describe('Param', function() {
  describe('delete', function() {
    it('should delete value', function(done) {
      gladys.param.delete('quote_of_the_day').then(function() {
        done();
      });
    });
  });
});
