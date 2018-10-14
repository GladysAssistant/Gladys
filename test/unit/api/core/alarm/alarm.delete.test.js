
describe('Alarm', function() {
  describe('delete', function() {
    it('should return alarm deleted', function(done) {
      var alarm = {
        id: 1
      };

      gladys.alarm
        .delete(alarm)
        .then(function() {
          done();
        })
        .catch(done);
    });

    it('should return error, alarm.id not provided', function(done) {
      gladys.alarm
        .delete({})
        .then(function() {
          done('No error detected');
        })
        .catch(function() {
          done();
        });
    });
  });
});
