var should = require('should');

describe('Update', function() {

  describe('getLifeEvents', function() {
    
    it.skip('should sync lifeEvents with GitHub', function (done) {
     	 
          gladys.update.getLifeEvents()
                .then(function(){
                    
                    done();
                })
                .catch(done);
    });
   
  });

});