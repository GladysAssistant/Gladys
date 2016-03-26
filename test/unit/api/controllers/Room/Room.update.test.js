var request = require('supertest');
var validateRoom = require('../../validator/roomValidator.js');

describe('RoomController', function() {

  describe('update', function() {
    
    it('should update a room', function (done) {
        
        var room = {
            house: 1,
            name: 'Test room'
        };
        
     	request(sails.hooks.http.app)
        .patch('/room/1?token=test')
        .send(room)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateRoom(res.body);
            res.body.name.should.equal(room.name);
            done();
        });

    });
    
  });


});