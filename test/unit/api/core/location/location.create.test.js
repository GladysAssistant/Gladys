var should = require('should');
var validateLocation = require('../../validator/locationValidator.js');

describe('Location', function() {

  describe('create', function() {
    
    it('should return location created', function (done) {
     	 
          var location = {
                latitude: 40.7412,
                longitude: -73.9896,
                datetime: '2015-05-12 18:00:00',
                user: 1
          };
          
          gladys.location.create(location)
                .then(function(result){
                    validateLocation(result);
                    done();
                }).catch(done);
    });
    
  });

});