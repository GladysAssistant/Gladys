var request = require('supertest');
var validateHouse = require('../validator/houseValidator.js');

describe('HouseController', function() {

  describe('index', function() {
    
    it('should a valid list of userrelation', function (done) {
     	request(sails.hooks.http.app)
        .get('/house/index?token=test')
        .expect(200)
        .end(function(err, res) {
            for(var i = 0; i < res.body.length; i++){
                validateHouse(res.body[i].house);
            }
            done();
        });

    });
    
  });

});