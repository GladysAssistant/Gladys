var request = require('supertest');

describe('DeviceStateController', function() {
  describe('getFilteredMinMax', function() {

    it('should get min and max device states filtered by date range', function(done) {
      request(sails.hooks.http.app)
        .get('/devicestate/filtered/minmax?token=test&devicetype=2&startDate=2018-10-04&endDate=2018-10-11')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          res.body.should.be.instanceof(Array);
          res.body.forEach(deviceState => {
            deviceState.should.have.property('min');
            deviceState.should.have.property('max');
            deviceState.should.have.property('datetime');
          });

          done();
        });
    });
  });
});
