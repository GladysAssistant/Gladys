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
 * @param {object} weatherInformation - OpenWeather weather information.
 * @returns {object} Return gladys weather information.
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
 * @param {object} options - The weather call options.
 * @param {object} result - The result of the API call to OpenWeather.
 * @param {object} forecast - Forecast for next 5 days.
 * @returns {object} Return a formatted weather object.
 * @example
 * const formatted = formatResults(options, result);
 */
function formatResults(options, result, forecast) {
  const dataToReturn = {};

  // no offset management for now
  const dataPoint = result;

  dataToReturn.temperature = dataPoint.main.temp;
  dataToReturn.humidity = dataPoint.main.humidity;
  dataToReturn.pressure = dataPoint.main.pressure;
  dataToReturn.datetime = new Date(dataPoint.dt * 1000);
  dataToReturn.units = options.units;
  dataToReturn.wind_speed = dataPoint.wind.speed;
  dataToReturn.wind_direction = dataPoint.wind.deg;

  dataToReturn.weather = translateWeatherOWToGladys(dataPoint.weather[0]);

  if (forecast) {
    dataToReturn.hours = [];
    for (let i = 0; i < 8; i += 1) {
      dataToReturn.hours.push({
        temperature: Math.round(forecast.list[i].main.temp),
        humidity: forecast.list[i].main.humidity,
        pressure: forecast.list[i].main.pressure,
        datetime: new Date(forecast.list[i].dt * 1000),
        units: options.units,
        wind_speed: forecast.list[i].wind.speed,
        wind_direction: forecast.list[i].wind.deg,
        weather: translateWeatherOWToGladys(forecast.list[i].weather[0]),
      });
    }
  }

  if (forecast) {
    const dayMin = new Map();
    const dayMax = new Map();
    const days = [];
    for (let i = 0; i < forecast.list.length; i += 1) {
      const currentForecast = forecast.list[i];
      const currentTemp = currentForecast.main.temp;
      const date = currentForecast.dt_txt.substr(0, 10);
      if (!dayMin.has(date)) {
        days.push({
          datetime: new Date(currentForecast.dt * 1000),
          date,
          temperature_min: null,
          temperature_max: null,
        });
        dayMin.set(date, currentTemp);
      }
      if (!dayMax.has(date)) {
        dayMax.set(date, currentTemp);
      }
      if (dayMin.get(date) > currentTemp) {
        dayMin.set(date, currentTemp);
      }
      if (dayMax.get(date) < currentTemp) {
        dayMax.set(date, currentTemp);
      }
    }
    days.forEach((day) => {
      day.temperature_min = Math.round(dayMin.get(day.date));
      day.temperature_max = Math.round(dayMax.get(day.date));
      delete day.date;
    });

    dataToReturn.days = days;
  }

  return dataToReturn;
}

module.exports = {
  formatResults,
  translateWeatherOWToGladys,
};
