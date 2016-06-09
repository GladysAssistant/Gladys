var should = require('should');
var validateHouse = require('../../validator/houseValidator.js');

describe('House', function() {

  describe('get', function() {
    
    it('should return list of house', function (done) {
        
          var user = {
              id: 1
          };
          
          gladys.house.get({user})
                .then(function(result){
                    validateHouse(result);
                    done();
                }).catch(done);
    });
    
  });

});