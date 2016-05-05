var should = require('should');

describe('Launcher', function() {

  describe('delete', function() {
    
    it.only('should delete launcher', function (done) {
          
          gladys.launcher.delete({id:1})
                .then(function(){
                    
                    done();
                }).catch(done);
    });
    
  });

});