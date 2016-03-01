var should = require('should');
var validateScript = require('../../validator/scriptValidator.js');

describe('Script', function() {

  describe('exec', function() {
    
    it('should execute a script', function (done) {
     	var user = {
             id: 1
         };
         
         var script = {
             id: 1
         };
        
        gladys.script.exec({user, script})
            .then(function(result){
               
                done();
            }).catch(done);

    });
   
  });

});