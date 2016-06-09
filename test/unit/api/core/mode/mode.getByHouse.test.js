var should = require('should');
var validateEvent = require('../../validator/eventValidator.js');

describe('Mode', function() {

  describe('getByHouse', function() {
    
    it('should return last mode of a house', function (done) {
          
          var house = {
              id: 1
          };
          
          gladys.mode.getByHouse(house)
                .then(function(result){
                    validateEvent(result);
                    done();
                })
                    .catch(done);
    });
    
    it('should return last mode of a house who don\'t have any events yet', function (done) {
          
          var house = {
              id: 2
          };
          
          gladys.mode.getByHouse(house)
                .then(function(result){
                    result.should.have.property('value');
                    done();
                })
                    .catch(done);
    });
    
  });

});