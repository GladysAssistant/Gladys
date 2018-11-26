
describe('DeviceState', function() {
  describe('getFiltered', function() {
    it('should return all deviceState by date range', function(done) {

      var options = {
        threshold: 0,
        devicetype: 2,
        startDate: '2018-10-04',
        endDate: '2018-10-11',
      };

      gladys.deviceState.getFiltered(options)
        .then(function(result) {
          result.should.be.instanceof(Array);
          result.should.have.length(7);
          result.forEach(devicestate => {
            devicestate.should.have.property('x');
            devicestate.should.have.property('y');
          });
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});