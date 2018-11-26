
describe('DeviceState', function() {
  describe('getFilteredMinMax', function() {
    it('should return all min max deviceState by date range', function(done) {

      var options = {
        devicetype: 2,
        startDate: '2018-10-04',
        endDate: '2018-10-10',
      };

      gladys.deviceState.getFilteredMinMax(options)
        .then(function(result) {
          result.should.be.instanceof(Array);
          result.forEach(deviceState => {
            deviceState.should.have.property('min');
            deviceState.should.have.property('max');
            deviceState.should.have.property('datetime');
          });
          done();
        })
        .catch(function(err) {
          done(err);
        });
    });
  });
});
