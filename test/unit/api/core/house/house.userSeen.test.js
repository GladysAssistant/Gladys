var should = require('should');
var validateHouse = require('../../validator/houseValidator.js');

describe('House', function() {

  describe('userSeen', function() {
    
    it('should create a back-at-home event', function (done) {
        
        var options = {
            house: 1,
            user: 2
        };
          
        gladys.house.userSeen(options)
            .then(function(result){
                should.exist(result);
                
                done();
            }).catch(done);
    });
    
  });
});