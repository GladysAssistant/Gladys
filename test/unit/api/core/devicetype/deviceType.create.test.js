

describe('DeviceType', function() {
  describe('create', function() {
    it('should create new deviceType', function(done) {
      var obj = {
        device: 1,
        type: 'binary',
        min: 0,
        max: 1,
        sensor: false
      };

      gladys.deviceType
        .create(obj)
        .then(function(type) {
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });

    it('should update deviceType', function(done) {
      var obj = {
        device: 1,
        identifier: 'UNIQUE_IDENTIFIER',
        type: 'multilevel',
        min: 0,
        max: 1,
        sensor: false
      };

      gladys.deviceType
        .create(obj)
        .then(function(type) {
          console.log(type);
          type.type.should.equal(obj.type);
          done();
        })
        .catch(done);
    });
  });
});
