var request = require('supertest');

describe('Notification', function() {
  describe('create', function() {
    it('should create a notification', function(done) {
      var notification = {
        title: 'Fire !',
        text: 'Sir, there is a fire in the kitchen !',
        icon: 'fa fa-fire',
        iconColor: 'bg-yellow',
        priority: 2
      };

      request(sails.hooks.http.app)
        .post('/notification?token=test')
        .send(notification)
        .expect(201)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          done();
        });
    });
  });
});
