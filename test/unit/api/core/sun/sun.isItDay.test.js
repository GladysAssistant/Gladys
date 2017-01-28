var should = require('should');

describe('Sun', function() {

  describe('isItDay', function() {
    
    it('should return true or false depending the time', function (done) {
        
          var options = {
              house: 1
          };
          
          gladys.sun.isItDay(options)
                .then(function(result){
                    result.should.be.a.Boolean;
                    done();
                }).catch(done);
    });
    
  });

});
