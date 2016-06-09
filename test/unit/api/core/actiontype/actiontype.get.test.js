var should = require('should');
var validateActionType = require('../../validator/actionTypeValidator.js');

describe('ActionType', function() {

  describe('get', function() {
    
    it('should return list of actionTypes', function (done) {
     
        
        gladys.actionType.get()
        .then(function(result){
           validateActionType(result);
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});