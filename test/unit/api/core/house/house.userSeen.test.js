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
                result.should.have.property('user', 2);
                result.should.have.property('house', 1);
                result.should.have.property('eventtype', 7);
                done();
            }).catch(done);
    });

    it('should create a user-seen-at-home event', function (done) {
        
        var options = {
            house: 1,
            user: 1
        };
          
        gladys.house.userSeen(options)
            .then(function(result){
                result.should.have.property('user', 1);
                result.should.have.property('house', 1);
                result.should.have.property('eventtype', 8);

                done();
            }).catch(done);
    });
    
  });
});