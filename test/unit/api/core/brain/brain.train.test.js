var should = require('should');

describe('Brain', function() {

  describe('train', function() {
    
    it('should train the brain with sentences', function (done) {
     	
        gladys.brain.train().then(function(result){
           
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});