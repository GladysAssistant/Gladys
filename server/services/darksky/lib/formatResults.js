/**
 * @description Transform DarkSky JSON to Gladys data.
 * @param {Object} options - The weather call options.
 * @param {Object} result - The result of the API call to DarkSky.
 * @returns {Object} Return a formatted weather object.
 * @example
 * const formatted = formatResults(options, result);
 */
function formatResults(options, result) {
  const dataToReturn = {};
  let dataPoint = null;

  // if options.offset == 0, it means it's now
  if (options.offset === 0) {
    dataPoint = result.currently;

    // if options.offset < 24, we take in the hour response
  } else if (options.offset < 24) {
    if (result.hourly.data.length > options.offset) {
      dataPoint = result.hourly.data[options.offset];
    } else {
      dataPoint = result.currently;
    }

    // else if options.offset > 24, we take in the daily response
  } else {
    // we transform options.offset in day count
    options.offset = Math.round(options.offset / 24);

    if (result.daily.data.length > options.offset) {
      dataPoint = result.daily.data[options.offset];
    } else {
      dataPoint = result.daily.data[result.daily.data.length - 1];
    }
  }

  dataToReturn.temperature = dataPoint.temperature;
  dataToReturn.humidity = dataPoint.humidity;
  dataToReturn.pressure = dataPoint.pressure;
  dataToReturn.datetime = new Date(dataPoint.time * 1000);
  dataToReturn.units = options.units;
  dataToReturn.wind_speed = dataPoint.windSpeed;

  if (dataPoint.icon.search('snow') !== -1) {
    dataToReturn.weather = 'snow';
  } else if (dataPoint.icon.search('rain') !== -1) {
    dataToReturn.weather = 'rain';
  } else if (dataPoint.icon.search('clear') !== -1) {
    dataToReturn.weather = 'clear';
  } else if (dataPoint.icon.search('cloud') !== -1) {
    dataToReturn.weather = 'cloud';
  } else if (dataPoint.icon.search('fog') !== -1) {
    dataToReturn.weather = 'fog';
  } else if (dataPoint.icon.search('sleet') !== -1) {
    dataToReturn.weather = 'sleet';
  } else if (dataPoint.icon.search('wind') !== -1) {
    dataToReturn.weather = 'wind';
  } else {
    dataToReturn.weather = 'unknown';
  }

  return dataToReturn;
}

module.exports = {
  formatResults,
};
