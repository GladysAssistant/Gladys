

describe('Weather', function() {
  describe('command', function() {
    it('should return label and scope for answer', function(done) {
      var scope = {
        label: 'get-weather-now',
        user: {
          id: 1,
          language: 'en'
        }
      };

      gladys.weather
        .command(scope)
        .then(response => {
          response.should.have.property('label', 'tell-rain-weather-now');
          response.should.have.property('scope');
          response.scope.should.have.property('%WEATHER_TEMP%');
          response.scope.should.have.property('%WEATHER_HUMIDITY%');
          response.scope.should.have.property('%WEATHER_PRESSURE%');
          response.scope.should.have.property('%WEATHER_DATETIME%');
          response.scope.should.have.property('%WEATHER_UNITS%');
          response.scope.should.have.property('%WEATHER_WINDSPEED%');
          response.scope.should.have.property('%WEATHER_DESCRIPTION%');
          done();
        })
        .catch(done);
    });
  });
});
