var should = require('should');
var validateModule = require('../../validator/moduleValidator.js');

describe('Module', function() {

  describe('heartbeat', function() {
    
    it('should set lastSeen to now', function (done) {
     	
          gladys.module.heartbeat({machine: '73a84d3b-a438-4807-87cc-04896b11e34b', slug: 'hue'})
                .then((result) => {
                    validateModule(result);
                    done();
                }).catch(done);
    });
    
  });

});