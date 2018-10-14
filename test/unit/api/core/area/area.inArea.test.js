
var validateArea = require('../../validator/areaValidator.js');

describe('Area', function() {
  describe('inArea', function() {
    it('should return if location is in area', function(done) {
      var location = {
        latitude: 40.7412,
        longitude: -73.9896,
        user: 1
      };

      gladys.area
        .inArea(location)
        .then(function(result) {
          validateArea(result);
          done();
        })
        .catch(done);
    });
  });
});
