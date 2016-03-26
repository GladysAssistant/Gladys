var request = require('supertest');
var validateRoom = require('../../validator/roomValidator.js');

describe('RoomController', function() {

  describe('delete', function() {
    
    it('should delete a room', function (done) {
        
     	request(sails.hooks.http.app)
        .delete('/room/id?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            done();
        });

    });
    
  });


});