var should = require('should');
var validateStateParam = require('../../validator/stateParamValidator.js');

describe('StateParam', function() {

  describe('create', function() {
    
    it('should return stateParam created', function (done) {
     	
         var stateParam = {
             statetypeparam: 1,
             state: 1,
             value: 'Test'
         };
        
        gladys.stateParam.create(stateParam)
            .then(function(result){
                
                validateStateParam(result);
                done();
            }).catch(done);

    });
   
  });

});