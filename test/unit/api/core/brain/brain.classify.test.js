var should = require('should');

describe('Brain', function() {

  describe('classify', function() {
    
    it.skip('should classify a sentence and call a service', function (done) {
     	
        gladys.brain.trainNew()
            .then(function(){
              return gladys.brain.classify('THIS IS A TEST, ARE YOU GETTING ME ???');   
            })
           .then(function(result){ 
                done();
            })
            .catch(function(err){
                done(err);
            });

    });
  
  });

});