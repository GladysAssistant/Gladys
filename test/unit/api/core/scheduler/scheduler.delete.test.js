

describe('Scheduler', function() {
  describe('cancel', function() {
    it('should cancel event', function(done) {
      var obj = {
        event: {
          code: 'test',
          value: 'test'
        },
        rule: {
          hour: 14,
          minute: 30,
          dayOfWeek: 0
        }
      };

      gladys.scheduler
        .create(obj)
        .then(function(index) {
          return gladys.scheduler.delete({ index: index });
        })
        .then(function() {
          done();
        })
        .catch(done);
    });

    it('should not cancel event, event does not exist', function(done) {
      var obj = {
        index: 1
      };

      gladys.scheduler
        .delete(obj)
        .then(function(index) {
          done('No error detected');
        })
        .catch(function(err) {
          done();
        });
    });
  });
});
