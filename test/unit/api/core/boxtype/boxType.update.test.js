var should = require('should');
var validateBoxType = require('../../validator/boxTypeValidator.js');

describe('BoxType', function() {

  describe('update', function() {
    
    it('should update a boxType', function (done) {
     	
        gladys.boxType.update({id:1, title:'test2'}).then(function(result){
           validateBoxType(result);
           result.title.should.equal('test2');
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});