var request = require('supertest');
var validateNotificationUser = require('../../validator/notificationUserValidator.js');

describe('NotificationUserController', function() {
  describe('create', function() {
    it('should create a new notificationUser', function(done) {
      var notificationUser = {
        notificationtype: 1,
        priority: 2
      };

      request(sails.hooks.http.app)
        .post('/notificationuser?token=test')
        .send(notificationUser)
        .expect(201)
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
