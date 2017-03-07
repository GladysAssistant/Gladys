var should = require('should');
var validateHouse = require('../../validator/houseValidator.js');

describe('House', function() {

  describe('checkUserPresence', function() {
    
    it('should check if user is present and not seen since a given time', function (done) {
          
        gladys.house.checkUsersPresence()
            .then(function(result){
                
                done();
            }).catch(done);
    });
    
  });
});