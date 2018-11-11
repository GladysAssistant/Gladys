
var validateArea = require('../../validator/areaValidator.js');

describe('Area', function() {
  describe('create', function() {
    it('should return area created', function(done) {
      var area = {
        name: 'My Awesome work place',
        latitude: 37.773972,
        longitude: -122.431297,
        radius: 100,
        user: 1,
        color: 7890
      };

      gladys.area
        .create(area)
        .then(function(result) {
          validateArea(result);
          done();
        })
        .catch(done);
    });
  });
});
