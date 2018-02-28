var should = require('should');
var validateBox = require('../../validator/boxValidator.js');

describe('Box', function() {

  describe('update', function() {
    
    it('should update a box', function (done) {
     	
        gladys.box.update({id:1, active: 0, params: {test: 'test'}}).then(function(result){
           validateBox(result);
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});