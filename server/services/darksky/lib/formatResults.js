/**
 * @description Transform DarkSky Icon to weather icon and summary.
 * @param {string} weather - The weather icon.
 * @param {Date} [datetime] - Date in timestamp format.
 * @param {Date} [sunrise] - Sunrise datetime in timestamp format.
 * @param {Date} [sunset] - Sunset datetime in timestamp format.
 * @returns {Object} Return an icon and a summary.
 * @example
 * const {icon, summary} = translateIconToWeather(darkskyIcon);
 */
const translateIconToWeather = (weather, datetime = null, sunrise = null, sunset = null) => {
  if (weather.search('cloud') !== -1) {
    return { icon: 'cloud', summary: 'cloudy' };
  }
  if (weather.search('night') !== -1 && (datetime && sunrise && sunset && (datetime < sunrise || datetime > sunset))) {
    return { icon: 'night', summary: 'clear night' };
  }
  if (weather.search('rain') !== -1) {
    return { icon: 'rain', summary: 'raining' };
  }
  if (weather.search('clear') !== -1) {
    return { icon: 'clear', summary: 'clear sky' };
  }
  if (weather.search('snow') !== -1) {
    return { icon: 'snow', summary: 'snowing' };
  }
  if (weather.search('fog') !== -1) {
    return { icon: 'fog', summary: 'floggy' };
  }
  if (weather.search('sleet') !== -1) {
    return { icon: 'sleet', summary: 'sleety' };
  }
  if (weather.search('wind') !== -1) {
    return { icon: 'wind', summary: 'windy' };
  }
  return { icon: 'unknown', summary: 'unknown' };
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
  let dataPoint = result.currently;
  if (options.target === 'currently') {
    dataToReturn.temperature = Number(dataPoint.temperature.toFixed(2));
  } else if (options.target === 'hourly') {
    dataToReturn.temperature = Math.round(dataPoint.temperature);
  } else if (options.target === 'daily') {
    [dataPoint] = result.daily.data;
    if (dataPoint.temperatureMin) {
      dataToReturn.temperatureMin = Math.round(dataPoint.temperatureMin);
    }
    if (dataPoint.temperatureMax) {
      dataToReturn.temperatureMax = Math.round(dataPoint.temperatureMax);
    }
  }

  dataToReturn.datetime = new Date(dataPoint.time * 1000);
  dataToReturn.units = options.units;
  dataToReturn.time_sunrise = new Date(result.daily.data[0].sunriseTime * 1000);
  dataToReturn.time_sunset = new Date(result.daily.data[0].sunsetTime * 1000);

  const { icon, summary } = translateIconToWeather(
    dataPoint.icon,
    dataToReturn.datetime,
    dataToReturn.time_sunrise,
    dataToReturn.time_sunset,
  );
  dataToReturn.weather = icon;
  dataToReturn.summary = summary;

  if (options.mode && options.mode === 'advanced') {
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

    if (result.hourly) {
      const dataHours = result.hourly.data;
      dataToReturn.hours = [];
      for (let i = 1; i < 13; i += 1) {
        if (i < 5 || i % 2 === 0) {
          dataToReturn.hours.push({
            datetime: new Date(dataHours[i].time * 1000),
            summary: dataHours[i].summary,
            weather: translateIconToWeather(
              dataHours[i].icon,
              new Date(dataHours[i].time * 1000),
              dataToReturn.time_sunrise,
              dataToReturn.time_sunset,
            ).icon,
            temperature: Math.round(dataHours[i].temperature),
            precipitation_type: dataHours[i].precipType,
            precipitation_probability: Math.round(dataHours[i].precipProbability * 100),
          });
        }
      }
    }
  }
  return dataToReturn;
};

module.exports = {
  formatResults,
};
