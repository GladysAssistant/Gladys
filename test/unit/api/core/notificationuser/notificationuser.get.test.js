
var validateNotificationUser = require('../../validator/notificationUserValidator.js');

describe('NotificationUser', function() {
  describe('get', function() {
    it('should get notificationUsers', function(done) {
      var user = {
        id: 1
      };

      gladys.notificationUser.get(user).then(function(result) {
        validateNotificationUser(result);
        done();
      });
    });
  });
});
