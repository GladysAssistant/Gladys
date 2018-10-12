

describe('Calendar', function() {
  describe('command', function() {
    it('should return next event user', function(done) {
      var scope = {
        label: 'get-next-event',
        user: {
          id: 1,
          language: 'en'
        }
      };

      gladys.calendar
        .command(scope)
        .then(function(result) {
          result.should.have.property('label', 'tell-next-event-calendar');
          result.should.have.property('scope');
          result.scope.should.have.property('%NEXT_EVENT_TITLE%');
          result.scope.should.have.property('%NEXT_EVENT_START_DATE%');
          result.scope.should.have.property('%NEXT_EVENT_START_TIME%');
          result.scope.should.have.property('%NEXT_EVENT_START_DATETIME%');
          result.scope.should.have.property('%NEXT_EVENT_START_IN%');
          result.scope.should.have.property('%NEXT_EVENT_END_DATE%');
          result.scope.should.have.property('%NEXT_EVENT_END_TIME%');
          result.scope.should.have.property('%NEXT_EVENT_END_DATETIME%');
          result.scope.should.have.property('%NEXT_EVENT_END_IN%');
          done();
        })
        .catch(done);
    });
  });
});
