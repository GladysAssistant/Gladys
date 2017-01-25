var should = require('should');

describe('Weather', function() {

  describe('addProvider', function() {
    
    it('should get weather', function (done) {
         
         var options = {
             latitude: 45,
             longitude: 45,
             date: 'now'
         };
        
         gladys.weather.get(options)
            .then((result) => {
                result.should.have.property('temperature');
                done();
            })
            .catch(done);
    });

    it('should return an error', function (done) {
         
         var options = {
             
         };
        
         gladys.weather.get(options)
            .then((result) => {
                done('No error returned');
            })
            .catch(() => {
                done();
            });
    });
   
  });

});