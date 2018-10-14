var request = require('supertest');

describe('NotificationController', function() {
  describe('read', function() {
    it('should read notifications', function(done) {
      request(sails.hooks.http.app)
        .patch('/notification/read?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          res.body.should.be.instanceOf(Array);
          res.body.forEach(function(n) {
            n.should.have.property('isRead', true);
          });
          done();
        });
    });
  });
});
