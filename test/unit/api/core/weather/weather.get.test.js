var should = require('should');

describe('Weather', function() {

  describe('get', function() {
    
    it.skip('should return weather in San Francisco', function (done) {
     	 
          gladys.weather.get({latitude: 37.80795, longitude: -122.476226})
                .then(function(weather){
                    weather.should.have.property('currently');
                    done();
                })
                .catch(done);
    });
   
  });

});