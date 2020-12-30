const WEATHER_OW_TO_GLADYS = {
  Thunderstorm: 'thunderstorm',
  Drizzle: 'drizzle',
  Rain: 'rain',
  Snow: 'snow',
  Mist: 'fog',
  Fog: 'fog',
  Clear: 'clear',
  Clouds: 'cloud',
};

/**
 * @description Transform OpenWeather weather information to gladys weather information.
 * @param {string} weatherInformation - OpenWeather weather information.
 * @returns {Object} Return gladys weather information.
 * @example
 * const weather = translateIconToWeather(weather);
 */
const translateWeatherOWToGladys = (weatherInformation) => {
  // Docs: https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
  if (weatherInformation.main in WEATHER_OW_TO_GLADYS) {
    return WEATHER_OW_TO_GLADYS[weatherInformation.main];
  }
  return 'unknown';
};

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

  dataToReturn.temperature = dataPoint.current.temp;
  dataToReturn.humidity = dataPoint.current.humidity;
  dataToReturn.pressure = dataPoint.current.pressure;
  dataToReturn.datetime = new Date(dataPoint.current.dt * 1000);
  dataToReturn.units = options.units;
  dataToReturn.wind_speed = dataPoint.current.wind_speed;
  dataToReturn.wind_direction = dataPoint.current.wind_deg;

  dataToReturn.weather = translateWeatherOWToGladys(dataPoint.current.weather[0]);

  if (result.hourly) {
    const dataHours = result.hourly;
    dataToReturn.hours = [];
    for (let i = 1; i < 9; i += 1) {
      dataToReturn.hours.push({
        temperature: Math.round(dataHours[i].temp),
        humidity: dataHours[i].humidity,
        pressure: dataHours[i].pressure,
        datetime: new Date(dataHours[i].dt * 1000),
        units: options.units,
        wind_speed: dataHours[i].wind_speed,
        wind_direction: dataHours[i].wind_deg,
        weather: translateWeatherOWToGladys(dataHours[i].weather[0]),
      });
    }
  }

  if (result.daily) {
    const dataDaily = result.daily;
    dataToReturn.days = [];
    for (let i = 1; i < dataDaily.length; i += 1) {
      dataToReturn.days.push({
        temperature_min: Math.round(dataDaily[i].temp.min),
        temperature_max: Math.round(dataDaily[i].temp.max),
        humidity: dataDaily[i].humidity,
        pressure: dataDaily[i].pressure,
        datetime: new Date(dataDaily[i].dt * 1000),
        units: options.units,
        wind_speed: dataDaily[i].wind_speed,
        wind_direction: dataDaily[i].wind_deg,
        weather: translateWeatherOWToGladys(dataDaily[i].weather[0]),
      });
    }
  }

  return dataToReturn;
}

module.exports = {
  formatResults,
};
