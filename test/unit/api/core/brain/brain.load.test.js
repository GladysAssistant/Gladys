var should = require('should');

describe('Brain', function() {

  describe('load', function() {
    
    it('should load the brain ', function (done) {
     	
        gladys.brain.load().then(function(result){
           
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});