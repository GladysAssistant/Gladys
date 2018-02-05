var should = require('should');

describe('House', function() {

  describe('isUserNotAtHome', function() {
    
    it('should return false, user is at home', function (done) {
        
          var options = {
              house: 1,
              user: 1
          };
          
          gladys.house.isUserNotAtHome(options)
                .then(function(result){
                    result.should.equal(false);
                    done();
                }).catch(done);
    });

    it('should return true, user is not at home', function (done) {
        
          var options = {
              house: 1,
              user: 2
          };
          
          gladys.house.isUserNotAtHome(options)
                .then(function(result){
                    result.should.equal(true);
                    done();
                }).catch(done);
    });
    
  });

});