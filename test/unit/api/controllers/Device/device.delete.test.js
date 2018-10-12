var request = require('supertest');

describe('DeviceController', function() {
  describe('delete', function() {
    it('should delete a device', function(done) {
      request(sails.hooks.http.app)
        .delete('/device/1?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          console.log(res.body);
          done();
        });
    });
  });
});
