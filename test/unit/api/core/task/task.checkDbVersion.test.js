var should = require('should');

describe('task', function() {

  describe('checkDbVersion', function() {
    
    it('should checkDbVersion', function (done) {   
          gladys.task.checkDbVersion()
                .then((result) => {
                    
                    done();
                });
    });
    
  });

});