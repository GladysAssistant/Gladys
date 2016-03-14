
module.exports.forecast = {
  apiKey: process.env.FORECAST_API_KEY,
  units: process.env.FORECAST_UNITS || 'celcius',
  
  // default cache is set to 30 minutes
  ttl: {
      minutes: process.env.FORECAST_TTL || 30
  }  
};