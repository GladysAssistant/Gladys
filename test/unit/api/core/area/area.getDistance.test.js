
var validateArea = require('../../validator/areaValidator.js');
var validateDistance = require('../../validator/areaDistanceValidator.js');

describe('Area', function() {
  describe('getDistance', function() {
    it('should return list of areas with correct distance from location', function(done) {
      var location = {
        latitude: 40.7412,
        longitude: -73.9896,
        user: 1
      };

      distances = [0.11099906397408849, 397485.76070203906];

      gladys.area
        .getDistance(location)
        .then(function(result) {
          validateArea(result);
          validateDistance(result, distances);
          done();
        })
        .catch(done);
    });
  });
});
