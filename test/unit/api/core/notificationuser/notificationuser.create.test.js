
var validateNotificationUser = require('../../validator/notificationUserValidator.js');

describe('NotificationUser', function() {
  describe('create', function() {
    it('should return notificationUser created', function(done) {
      var notificationUser = {
        priority: 1,
        user: 1,
        notificationtype: 1
      };

      gladys.notificationUser.create(notificationUser).then(function(result) {
        validateNotificationUser(result);
        done();
      });
    });
  });
});
