var should = require('should');
var validateScript = require('../../validator/scriptValidator.js');

describe('Script', function() {

  describe('delete', function() {
    
    it('should delete script', function (done) {
     	var script = {
             id: 1
         };
        
        gladys.script.delete(script)
            .then(function(result){
                
                done();
            }).catch(done);

    });
   
  });

});