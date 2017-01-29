const shared = require('./weather.shared.js');
const Promise = require('bluebird');
const SunCalc = require('suncalc');

/**
 * Options 
 * {
 *   latitude,
 *   longitude,
 *   offset (in hour) ex: 1 (to see the weather in 1 hour)
 * }
 * 
 * returns =>
 * {
 *    temperature: 18,
 *    humidity: 0.96, {optional}
 *    pressure: 1000, {optional}
 *    weather: 'cloud' || 'rain' || 'snow'  
 * }
 */
module.exports = function get(options){

    if(!options || !options.latitude || !options.longitude) return Promise.reject(new Error('Weather : Latitude and longitude are required.'));
    if(!options.hasOwnProperty('offset')) options.offset = 0;

    return getWeatherProvider(0, options)
        .then((result) => {

            var now = new Date();
            // add day or night info to result
            var times = SunCalc.getTimes(now, options.latitude , options.longitude);

            if(now > times.sunset || now < times.sunrise) result.sun = 'night';
            else result.sun = 'day';

            return result;
        });  
};

function getWeatherProvider(index, options){
    if(!shared.providers[index]) return Promise.reject(new Error('No weather provider available')); 
    
    // call the provider
    return gladys.modules[shared.providers[index]].weather.get(options)
        .catch(() => {

            // if the provider is not available, call the next one
            return getWeatherProvider(index + 1, options);
        });
}