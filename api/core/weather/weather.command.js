const moment = require('moment');

module.exports = function command(scope) {

  var timing = 'now';

  // get user position
  // accuracy is not that important, so put high value
  return gladys.location.getUser(scope.user, {accuracy: 3000})
    
    // fallback to house latitude/longitude if location does not exist
    .catch(() => {
      sails.log.info(`Weather : command : Location of user ${scope.user.id} not found, so taking house coordinate`);
      return gladys.house.getAll()
        .then((houses) => {
          
          if(houses.length === 0) { 
            return new Error('Weather : command : No house found, unable to calculate weather');
          } 

          var house = houses[0];

          if (!house.latitude || !house.longitude) {
            return new Error('Weather : command : House do not have latitude & longitude, unable to calculate weather');
          }

          return {
            latitude: house.latitude,
            longitude: house.longitude
          };
        });
    })
    .then((location) => {

      sails.log.info(`Weather : command : Calculating weather at location latitude = "${location.latitude}", longitude = "${location.longitude}".`);

      var params = {
        latitude: location.latitude,
        longitude: location.longitude,
        offset: 0
      };

      if(scope.times && scope.times.length > 0) {

        // calculate offset in hour
        var currentTimestamp = new Date().getTime();
        var timestampToGetWeather = new Date(scope.times[0].start.date()).getTime();
        params.offset = Math.round((timestampToGetWeather - currentTimestamp)/1000/60/60);
      }

      // make sur offset is always positive
      if(params.offset < 0) {
        params.offset = 0;
      }

      // if offset is in the futur
      if(params.offset > 0 ) {
        timing = 'futur';
      }

      // get weather at this position and this offset
      return gladys.weather.get(params);
    })
    .then((weather) => {

      var response = {
        label: 'tell-' + weather.weather + '-weather-' + timing,
        scope: {
          '%WEATHER_TEMP%': weather.temperature,
          '%WEATHER_HUMIDITY%': weather.humidity,
          '%WEATHER_PRESSURE%': weather.pressure,
          '%WEATHER_DATETIME%':  moment(weather.datetime).locale(scope.user.language).format('LLL'),
          '%WEATHER_UNITS%': weather.units,
          '%WEATHER_WINDSPEED%': weather.windSpeed,
          '%WEATHER_DESCRIPTION%': weather.weather
        }
      };         

      return response;   
    });
};
