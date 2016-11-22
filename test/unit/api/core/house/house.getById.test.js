var should = require('should');
var validateHouse = require('../../validator/houseValidator.js');

describe('House', function() {

  describe('getById', function() {
    
    it('should return a specific house', function (done) {
        
          var house = {
              id: 1
          };
          
          gladys.house.getById(house)
                .then(function(result){
                    result.should.be.instanceOf(Object);
                    validateHouse(result);
                    result.id.should.equal(1);
                    done();
                }).catch(done);
    });
    
  });

});