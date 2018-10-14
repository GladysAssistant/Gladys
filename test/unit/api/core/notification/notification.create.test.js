
describe('Notification', function() {
  describe('create', function() {
    it('should return notification created', function(done) {
      var notification = {
        title: 'Fire !',
        text: 'Sir, there is a fire in the kitchen !',
        user: 1,
        icon: 'fa fa-fire',
        iconColor: 'bg-yellow',
        priority: 2
      };

      gladys.notification.create(notification).then(function() {
        done();
      });
    });
  });
});
