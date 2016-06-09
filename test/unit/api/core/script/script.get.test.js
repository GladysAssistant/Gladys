var should = require('should');
var validateScript = require('../../validator/scriptValidator.js');

describe('Script', function() {

  describe('get', function() {
    
    it('should return scripts', function (done) {
     	var user = {
             id: 1
         };
        
        gladys.script.get({user: user})
            .then(function(result){
                
                validateScript(result);
                done();
            }).catch(done);

    });
   
  });

});