var should = require('should');

describe('Brain', function() {

  describe('classify', function() {
    
    it.only('should classify a sentence and call a service', function (done) {
     	
        gladys.brain.load()
            .then(function(){
              return gladys.brain.classify('turn on the light in ');   
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