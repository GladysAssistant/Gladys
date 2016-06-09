var should = require('should');
var validateHouse = require('../../validator/houseValidator.js');

describe('House', function() {

  describe('create', function() {
    
    it('should return house created', function (done) {
     	 
          var house = {
            name: 'My wonderful house',
            address: '10880 Malibu Point',
            postcode: '90265',
            city: 'Malibu, CA',
            country: 'USA',
            latitude: 20,
            longitude: 10,
            uuid: '22f978ff-dfb8-466d-a767-0b09431eb1dd'
          };
          
          gladys.house.create(house)
                .then(function(result){
                    validateHouse(result);
                    done();
                }).catch(done);
    });
    
  });

});