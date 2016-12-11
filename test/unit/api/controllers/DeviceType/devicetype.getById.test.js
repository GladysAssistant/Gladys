var request = require('supertest');
var validateDeviceType = require('../../validator/deviceTypeValidator.js');

describe('DeviceTypeController', function() {

  describe('getById', function() {
    
    it('should get a devicetype by id', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/devicetype/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            console.log(res.body);

            validateDeviceType(res.body);
            
            done();
        });

    });
    
  });


});