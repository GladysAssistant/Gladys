var request = require('supertest');
var validateHouse = require('../../validator/houseValidator.js');

describe('HouseController', function() {

  describe('update', function() {
    
    it('should update a house', function (done) {
        
        var house = {
            name:'My awesome house',
            address: '10880 Malibu Point',
            city: 'Malibu',
            postcode: 90265,
            country: 'US'
        };
        
     	request(sails.hooks.http.app)
        .patch('/house/1?token=test')
        .send(house)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateHouse(res.body);
            res.body.name.should.equal(house.name);
            done();
        });

    });
    
  });


});