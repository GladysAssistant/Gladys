var should = require('should');

describe('Update', function() {

  describe('getActions', function() {
    
    it.skip('should get actions on github', function (done) {
     	 
          gladys.update.getActions({language: 'fr'})
                .then(function(){
                    
                    done();
                })
                .catch(done);
    });
   
  });

});