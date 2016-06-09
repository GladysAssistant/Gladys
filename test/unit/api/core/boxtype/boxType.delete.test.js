var should = require('should');
var validateBoxType = require('../../validator/boxTypeValidator.js');

describe('BoxType', function() {

  describe('delete', function() {
    
    it('should return boxType deleted', function (done) {
        
        gladys.boxType.delete({id:1}).then(function(result){

           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});