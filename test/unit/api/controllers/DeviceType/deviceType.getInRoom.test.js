var request = require('supertest');
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceTypeController', function() {

  describe('getInRoom', function() {
    
    it('should get all devicetype inside a room', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/room/1/devicetype?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.have.property('id');
            res.body.should.have.property('name');
            validateDeviceType(res.body.deviceTypes);
            
            done();
        });

    });


    it('should return empty array of deviceTypes', function (done) {

        request(sails.hooks.http.app)
       .get('/room/3/devicetype?token=test')
       .expect(200)
       .end(function(err, res) {
           if(err) return done(err);

           res.body.should.have.property('id');
           should.deepEqual(res.body.deviceTypes, []);
           
           done();
       });

   });
    
  });


});