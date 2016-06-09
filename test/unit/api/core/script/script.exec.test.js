var should = require('should');
var validateScript = require('../../validator/scriptValidator.js');

describe('Script', function() {

  describe('exec', function() {
    
    it('should execute a script', function (done) {
         
         var script = {
             id: 1
         };
        
        gladys.script.exec(script)
            .then(function(result){
               
                done();
            }).catch(done);

    });
   
  });

});