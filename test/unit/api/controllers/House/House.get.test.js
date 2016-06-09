var request = require('supertest');
var validateHouse = require('../../validator/houseValidator.js');

describe('HouseController', function() {

  describe('get', function() {
    
    it('should get houses', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/house?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateHouse(res.body);
            done();
        });

    });
    
  });


});