var should = require('should');
var validateActionType = require('../../validator/actionTypeValidator.js');

describe('ActionType', function() {

  describe('getByServiceFunction', function() {
    
    it('should return actionType by service & function', function (done) {
     
        gladys.actionType.getByServiceFunction({service: 'test', function: 'exec' })
            .then(function(result){
                result.should.be.instanceOf(Object);
                validateActionType(result);
                done();
            }).catch(done);

    });
  
  });

});