var request = require('supertest');
var validateRoom = require('../../validator/roomValidator.js');

describe('RoomController', function() {
  describe('get', function() {
    it('should get rooms', function(done) {
      request(sails.hooks.http.app)
        .get('/room?token=test')
        .expect(200)
        .end(function(err, res) {
          if (err) {
            return done(err); 
          }

          validateRoom(res.body);
          done();
        });
    });
  });
});
