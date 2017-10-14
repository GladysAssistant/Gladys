var should = require('should');
var validateStateType = require('../../validator/stateTypeValidator.js');

describe('StateType', function() {

  describe('getByServiceFunction', function() {
    
    it('should return stateType by service & function', function (done) {
     	
        var stateType = {
            service: 'test',
            function: 'exec'
        };
        
        gladys.stateType.getByServiceFunction(stateType)
            .then(function(result){
                result.should.be.instanceof(Object);
                validateStateType(result);
                result.service.should.equal(stateType.service);
                result.function.should.equal(stateType.function);
                done();
            }).catch(done);

    });
   
  });

});