var should = require('should');
var validateArea = require('../../validator/areaValidator.js');

describe('Area', function() {

  describe('update', function() {
    
    it('should update area', function (done) {
        
        var area = {
            id: 1,
            name: 'THIS IS A TEST MAN, A TEST !'
        };
           
          gladys.area.update(area)
                .then(function(result){
                    validateArea(result);
                    result.name.should.equal(area.name);
                    done();
                })
                .catch(done);
    });
    
     
    
  });

});