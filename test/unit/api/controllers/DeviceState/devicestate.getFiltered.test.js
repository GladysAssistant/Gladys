var request = require('supertest');

describe('DeviceStateController', function() {
  describe('getFiltered', function() {

    it('should get device state filtered by date range', function(done) {
      request(sails.hooks.http.app)
        .get('/devicestate/filtered?token=test&devicetype=2&startDate=2018-10-04&endDate=2018-10-11&threshold=0')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          res.body.should.be.instanceof(Array);
          res.body.should.have.length(7);
          res.body.forEach(devicestate => {
            devicestate.should.have.property('x');
            devicestate.should.have.property('y');
          });

          done();
        });
    });
  });
});
