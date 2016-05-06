var request = require('supertest');
var validateHouse = require('../../validator/houseValidator.js');

describe('HouseController', function() {

  describe('create', function() {
    
    it('should create a house', function (done) {
        
        var house = {
            name:'My awesome house',
            address: '10880 Malibu Point',
            city: 'Malibu',
            postcode: 90265,
            latitude: 20,
            longitude: 10,
            country: 'US'
        };
        
     	request(sails.hooks.http.app)
        .post('/house?token=test')
        .send(house)
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateHouse(res.body);
            done();
        });

    });
    
  });


});