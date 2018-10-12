var request = require('supertest');

describe('NotificationUserController', function() {
  describe('delete', function() {
    it('should delete a notificationUser', function(done) {
      request(sails.hooks.http.app)
        .delete('/notificationuser/1?token=test')
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
