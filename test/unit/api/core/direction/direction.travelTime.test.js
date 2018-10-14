

describe('Direction', function() {
  describe('travelTime', function() {
    it('should return travelTime', function(done) {
      var options = {
        origin: '1 Av. des Champs-Élysées, 75008 Paris France',
        destination: '18 Rue de Dunkerque, 75010 Paris France',
        mode: 'transit' // we are taking the metro !
      };

      gladys.direction
        .travelTime(options)
        .then(result => {
          result.should.have.property('departure_time');
          result.should.have.property('arrival_time');
          result.should.have.property('duration');
          done();
        })
        .catch(done);
    });
  });
});
