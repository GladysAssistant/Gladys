var Forecast = require('forecast');
var Promise = require('bluebird');

// Initialize
var forecast = new Forecast({
  service: 'forecast.io',
  key: sails.config.forecast.apiKey,
  units: sails.config.forecast.units, // Only the first letter is parsed
  cache: true,      // Cache API requests?
  ttl: sails.config.forecast.ttl
});

module.exports = function get(params){
    return new Promise(function(resolve, reject){
       if(!params || !params.latitude || !params.longitude) {
           return reject('Missing parameters, need latitude and longitude');
       } 
        
       forecast.get([params.latitude, params.longitude], function(err, weather){
          if(err) return reject(err);
          
          return resolve(weather); 
       });
    });
};
