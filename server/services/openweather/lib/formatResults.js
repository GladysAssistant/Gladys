/**
 * @description Transform OpenWeather JSON to Gladys data.
 * @param {Object} options - The weather call options.
 * @param {Object} result - The result of the API call to OpenWeather.
 * @returns {Object} Return a formatted weather object.
 * @example
 * const formatted = formatResults(options, result);
 */
function formatResults(options, result) {
  const dataToReturn = {};

  // no offset management for now
  const dataPoint = result;

  dataToReturn.name = dataPoint.name;
  dataToReturn.temperature = dataPoint.main.temp;
  dataToReturn.humidity = dataPoint.main.humidity;
  dataToReturn.pressure = dataPoint.main.pressure;
  dataToReturn.datetime = new Date(dataPoint.dt * 1000);
  dataToReturn.units = options.units;
  dataToReturn.wind_speed = dataPoint.wind.speed;
  dataToReturn.wind_direction = dataPoint.wind.deg;

  if (dataPoint.weather[0].main.search('Snow') !== -1) {
    dataToReturn.weather = 'snow';
  } else if (dataPoint.weather[0].main.search('Rain') !== -1) {
    dataToReturn.weather = 'rain';
  } else if (dataPoint.weather[0].main.search('Clear') !== -1) {
    dataToReturn.weather = 'clear';
  } else if (dataPoint.weather[0].main.search('Clouds') !== -1) {
    dataToReturn.weather = 'cloud';
  } else if (dataPoint.weather[0].main.search('Mist') !== -1) {
    dataToReturn.weather = 'fog';
  } else if (dataPoint.weather[0].main.search('Thunderstorm') !== -1) {
    dataToReturn.weather = 'thunderstorm';
  } else if (dataPoint.weather[0].main.search('Drizzle') !== -1) {
    dataToReturn.weather = 'drizzle';
  } else {
    dataToReturn.weather = 'unknown';
  }

  return dataToReturn;
}

module.exports = {
  formatResults,
};
