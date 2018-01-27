var should = require('should');

describe('House', function() {

  describe('isUserAsleep', function() {
    
    it('should return true, user is asleep', function (done) {
        
          var options = {
              house: 1,
              user: 1
          };
          
          gladys.house.isUserAsleep(options)
                .then(function(result){
                    result.should.equal(true);
                    done();
                }).catch(done);
    });

    it('should return false, user is not asleep', function (done) {
        
          var options = {
              house: 1,
              user: 2
          };
          
          gladys.house.isUserAsleep(options)
                .then(function(result){
                    result.should.equal(false);
                    done();
                }).catch(done);
    });
    
  });

});