var should = require('should');

describe('Update', function() {

  describe('getLastVersion', function() {
    
    it.skip('should return last version of Gladys', function (done) {
     	 
          gladys.update.getLastVersion()
                .then(function(version){
                    version.should.have.property('name');
                    done();
                })
                .catch(done);
    });
   
  });

});