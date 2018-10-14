var request = require('supertest');

describe('DeviceTypeController', function() {
  describe('delete', function() {
    it('should delete a devicetype', function(done) {
      request(sails.hooks.http.app)
        .delete('/devicetype/1?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          done();
        });
    });
  });
});
