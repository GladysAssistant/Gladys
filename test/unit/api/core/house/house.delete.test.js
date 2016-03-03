var should = require('should');
var validateHouse = require('../../validator/houseValidator.js');

describe('House', function() {

  describe('delete', function() {
    
    it('should delete house', function (done) {
          
          gladys.house.delete({id:1})
                .then(function(){
                    
                    done();
                }).catch(done);
    });
    
  });

});