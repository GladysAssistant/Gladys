
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
                label: 'tell-weather',
                scope: {
                    '%WEATHER_TEMP%': weather.temperature
                }
            };         

            return response;   
        });
};