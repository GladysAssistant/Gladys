var should = require('should');

describe('Area', function() {
  describe('changeArea', function() {
    it('should return Pepper pots work as left area and Tony\'s house as new area', function(done) {
      var location = {
        user: 2,
        latitude: 40.7412,
        longitude: -73.9896
      };

      gladys.area
        .changeArea(location)
        .then(areas => {

          areas.leftAreas.length.should.equal(1);
          areas.newAreas.length.should.equal(1);

          var leftExpected = {
            'id': 3,
            'name': 'Pepper Pots work',
            'latitude': 44,
            'longitude': -72,
            'radius': 100,
            'user': 2
          };
     
          var newExpected = {
            'id': 4,
            'name': 'Tony\'s house',
            'latitude': 40.7412,
            'longitude': -73.9896,
            'radius': 100,
            'user': 2
          };


          // we are forced to do parse => stringify because node-mysql return RowDataPacket instead of Object
          // so the deepEqual fails otherwise
          delete areas.leftAreas[0].updatedAt;
          delete areas.leftAreas[0].createdAt;
          delete areas.leftAreas[0].distance;
          delete areas.newAreas[0].updatedAt;
          delete areas.newAreas[0].createdAt;
          delete areas.newAreas[0].distance;
          should.deepEqual(JSON.parse(JSON.stringify(areas.leftAreas[0])), leftExpected);
          should.deepEqual(JSON.parse(JSON.stringify(areas.newAreas[0])), newExpected);

          done();
        })
        .catch(done);
    });
    
    it('should return no left area despite bad accuracy', function(done) {
      var location = {
        user: 2,
        latitude: 43.998240,
        longitude: -71.998337,
        accuracy: 200
      };

      gladys.area
        .changeArea(location)
        .then(areas => {

          areas.leftAreas.length.should.equal(0);
          areas.newAreas.length.should.equal(0);

          done();
        })
        .catch(done);
    });

    it('should return no new area despite bad accuracy', function(done) {
      var location = {
        user: 2,
        latitude: 40.742253,
        longitude: -73.991333,
        accuracy: 200
      };

      gladys.area
        .changeArea(location)
        .then(areas => {

          areas.leftAreas.length.should.equal(1);
          areas.newAreas.length.should.equal(0);

          done();
        })
        .catch(done);
    });



  });
});
