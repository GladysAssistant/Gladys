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

  dataToReturn.temperature = Number(dataPoint.temperature.toFixed(2));
  dataToReturn.datetime = new Date(dataPoint.time * 1000);
  dataToReturn.units = options.units;
  dataToReturn.weather = dataPoint.icon;
  dataToReturn.time_sunrise = new Date(result.daily.data[0].sunriseTime * 1000);
  dataToReturn.time_sunset = new Date(result.daily.data[0].sunsetTime * 1000);
  if (options.mode === 'advanced') {
    dataToReturn.humidity = Math.round(dataPoint.humidity * 100);
    dataToReturn.wind_speed = Number(dataPoint.windSpeed.toFixed(2));
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
        weather: dataHours[i].icon,
        apparent_temperature: Math.round(dataHours[i].apparentTemperature),
        precipitation_type: dataHours[i].precipType,
        precipitation_probability: Math.round(dataHours[i].precipProbability * 100),
      });
    }
  }
  return dataToReturn;
};

module.exports = {
  formatResults,
};
