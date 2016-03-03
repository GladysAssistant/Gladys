var should = require('should');
var validateHouse = require('../../validator/houseValidator.js');

describe('House', function() {

  describe('update', function() {
    
    it('should update house', function (done) {
        
        var house = {
            id:1, 
            name: 'updated-house'
        };
          
          gladys.house.update(house)
                .then(function(result){
                    validateHouse(result);
                    result.name.should.equal(house.name);
                    done();
                }).catch(done);
    });
    
  });

});