/**
 * @description Transform weather field from Darksky to FE icon for display.
 * @param {String} weather - The weather field from the api.
 * @returns {String} Return a string with the fe icon class.
 * @example
 * const icon = translateWeatherToFeIcon(weather);
 */
const translateWeatherToFeIcon = (weather) => {
  if (weather.search('snow') !== -1) {
    return 'fe-cloud-snow';
  }
  if (weather.search('rain') !== -1) {
    return 'fe-cloud-rain';
  }
  if (weather.search('clear') !== -1) {
    return 'fe-sun';
  }
  if (weather.search('cloud') !== -1) {
    return 'fe-cloud';
  }
  if (weather.search('fog') !== -1) {
    return 'fe-cloud';
  }
  if (weather.search('sleet') !== -1) {
    return 'fe-cloud-drizzle';
  }
  if (weather.search('wind') !== -1) {
    return 'fe-wind';
  }
  if (weather.search('night') !== -1) {
    return 'fe-moon';
  }
  return 'fe-question';
};

/**
 * @description Transform DarkSky JSON to Gladys data.
 * @param {Object} options - The weather call options.
 * @param {Object} result - The result of the API call to DarkSky.
 * @returns {Object} Return a formatted weather object.
 * @example
 * const formatted = formatResults(options, result);
 */
const formatResults = (options, result) => {
  const dataToReturn = {};
  const dataPoint = result.currently;

  dataToReturn.temperature = dataPoint.temperature.toFixed(2);
  dataToReturn.humidity = Math.round(dataPoint.humidity * 100);
  dataToReturn.pressure = Math.round(dataPoint.pressure);
  dataToReturn.datetime = new Date(dataPoint.time * 1000);
  dataToReturn.units = options.units;
  dataToReturn.wind_speed = dataPoint.windSpeed.toFixed(2);
  dataToReturn.apparent_temperature = dataPoint.apparentTemperature.toFixed(2);
  dataToReturn.precipitation_type = dataPoint.precipType;
  dataToReturn.precipitation_probability = Math.round(dataPoint.precipProbability * 100);
  dataToReturn.weather = translateWeatherToFeIcon(dataPoint.icon);
  dataToReturn.time_sunrise = new Date(result.daily.data[0].sunriseTime * 1000);
  dataToReturn.time_sunset = new Date(result.daily.data[0].sunsetTime * 1000);
  dataToReturn.alert = null;

  if (result.alerts) {
    dataToReturn.alert = {
      title: result.alerts[0].title,
      description: result.alerts[0].description,
      severity: result.alerts[0].severity,
    };
  }

  const dataHours = result.hourly.data;
  dataToReturn.hours = [];
  for (let i = 1; i < 9; i += 1) {
    dataToReturn.hours.push({
      datetime: new Date(dataHours[i].time * 1000),
      summary: dataHours[i].summary,
      weather: translateWeatherToFeIcon(dataHours[i].icon),
      apparent_temperature: Math.round(dataHours[i].apparentTemperature),
      precipitation_type: Math.round(dataHours[i].precipType),
      precipitation_probability: Math.round(dataHours[i].precipProbability * 100),
    });
  }

  return dataToReturn;
}

module.exports = {
  formatResults,
};
