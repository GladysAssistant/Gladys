var request = require('supertest');
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceTypeController', function() {

  describe('getByRoom', function() {
    
    it('should get all devicetype by room', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/devicetype/room?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body.forEach(function(room) {
                room.should.have.property('id');
                room.should.have.property('name');
                room.should.have.property('house');
                validateDeviceType(room.deviceTypes);
            });
            
            done();
        });

    });
    
  });


});