var request = require('supertest');
var validateRoom = require('../../validator/roomValidator.js');

describe('RoomController', function() {

  describe('create', function() {
    
    it('should create a room', function (done) {
        
        var room = {
            house: 1,
            name: 'Test room'
        };
        
     	request(sails.hooks.http.app)
        .post('/room?token=test')
        .send(room)
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateRoom(res.body);
            done();
        });

    });
    
  });


});