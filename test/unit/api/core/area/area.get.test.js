var should = require('should');
var validateArea = require('../../validator/areaValidator.js');

describe('Area', function() {

  describe('get', function() {
    
    it('should get all areas', function (done) {
           
          gladys.area.get({id: 1})
                .then(function(result){
                    validateArea(result);
                    done();
                })
                .catch(done);
    });
    
     
    
  });

});