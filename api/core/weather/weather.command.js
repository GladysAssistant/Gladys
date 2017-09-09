const moment = require('moment');

module.exports = function command(scope) {

    // get user position
    // accuracy is not that important, so put high value
    return gladys.location.getUser(scope.user, {accuracy: 3000})
        .then((location) => {

            // get weather at this position
            return gladys.weather.get(location);
        })
        .then((weather) => {

            var response = {
                label: 'tell-' + weather.weather + '-weather-' + weather.timing,
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
