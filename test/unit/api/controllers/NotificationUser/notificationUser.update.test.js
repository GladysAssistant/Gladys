var request = require('supertest');
var validateNotificationUser = require('../../validator/notificationUserValidator.js');

describe('NotificationUserController', function() {
  describe('update', function() {
    it('should update a notificationUser', function(done) {
      var notificationUser = {
        priority: 22
      };

      request(sails.hooks.http.app)
        .patch('/notificationuser/1?token=test')
        .send(notificationUser)
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateNotificationUser(res.body);
          res.body.priority.should.equal(22);
          done();
        });
    });
  });
});
