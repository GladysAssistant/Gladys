var should = require('should');

describe('Brain', function() {

  describe('trainNew', function() {
    
    it('should train the brain with sentences', function (done) {
     	
        gladys.brain.trainNew().then(function(result){
           
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});