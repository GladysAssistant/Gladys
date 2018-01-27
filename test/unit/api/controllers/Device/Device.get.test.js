var request = require('supertest');
var validateDevice = require('../../validator/deviceValidator.js');

describe('DeviceController', function() {

  describe('get', function() {
    
    it('should a valid list of device', function (done) {
     	request(sails.hooks.http.app)
        .get('/device?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body.length.should.not.equal(0);
            validateDevice(res.body);
            done();
        });

    });

    it('should return devices filtered by service', function (done) {
        request(sails.hooks.http.app)
       .get('/device?token=test&service=zwave')
       .expect(200)
       .end(function(err, res) {
           if(err) return done(err);

           res.body.should.be.instanceOf(Array);
           res.body.length.should.equal(1);
           validateDevice(res.body);
           res.body.forEach((device) => {
               device.service.should.equal('zwave');
           });
           done();
       });

   });
    
    it('should return 0 device (pagination test)', function (done) {
     	request(sails.hooks.http.app)
        .get('/device?token=test&take=0&skip=10')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body.length.should.equal(0);
            done();
        });

    });
    
  });
});