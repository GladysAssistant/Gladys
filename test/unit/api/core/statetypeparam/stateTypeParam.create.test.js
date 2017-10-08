var should = require('should');
var validateStateTypeParam = require('../../validator/stateTypeParamValidator.js');

describe('StateTypeParam', function() {

  describe('create', function() {
    
    it('should return StateTypeParam updated', function (done) {
     	
         var stateTypeParam = {
             statetype: 1,
             variablename: 'test',
             name: 'Test'
         };
        
        gladys.stateTypeParam.create(stateTypeParam)
            .then(function(result){
                
                validateStateTypeParam(result);
                done();
            }).catch(done);

    });

    it('should return StateTypeParam created', function (done) {
        
        var stateTypeParam = {
            statetype: 1,
            variablename: 'test2',
            name: 'Test'
        };
       
       gladys.stateTypeParam.create(stateTypeParam)
           .then(function(result){
               
               validateStateTypeParam(result);
               done();
           }).catch(done);

   });
   
  });

});