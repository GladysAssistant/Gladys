var should = require('should');
var validateBox = require('../../validator/boxValidator.js');

describe('Box', function() {

  describe('getById', function() {
    
    it('should return box by id', function (done) {
        
        gladys.box.getById(1).then(function(result){
           validateBox(result);
           result.should.have.property('params');
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});