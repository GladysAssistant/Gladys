
describe('House', function() {
  describe('checkUserPresencePerHouse', function() {
    it('should check if user is present and not seen since a given time in a given house', function(done) {

      house = {'id': 1};

      gladys.house
        .checkUsersPresencePerHouse(house)
        .then(function(result) {
          done();
        })
        .catch(done);
    });
  });
});
