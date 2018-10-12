var request = require('supertest');
var validateNotificationUser = require('../../validator/notificationUserValidator.js');

describe('NotificationUserController', function() {
  describe('get', function() {
    it('should get all notificationUser', function(done) {
      request(sails.hooks.http.app)
        .get('/notificationuser?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateNotificationUser(res.body);
          done();
        });
    });
  });
});
