var request = require('supertest');

describe('HouseController', function() {
  describe('delete', function() {
    it('should delete a house', function(done) {
      request(sails.hooks.http.app)
        .delete('/house/1?token=test')
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
