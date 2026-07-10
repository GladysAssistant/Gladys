// OpenWeather icon codes mapped to the closest Météo France icon codes,
// so the rest of the pipeline (widget, forecast summary) works with a single format.
// Docs: https://openweathermap.org/weather-conditions
/** @type {Object<string, string>} */
const OW_ICON_TO_MF = {
  '01': 'p1', // clear sky
  '02': 'p2', // few clouds
  '03': 'p4', // scattered clouds
  '04': 'p5', // broken/overcast clouds
  '09': 'p11', // shower rain
  10: 'p9', // rain
  11: 'p18', // thunderstorm
  13: 'p14', // snow
  50: 'p6', // mist
};

const WIND_CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/**
 * @description Convert an OpenWeather icon code (e.g. "10d") to a Météo France icon code (e.g. "p9j").
 * @param {string|null} owIcon - OpenWeather icon code.
 * @returns {string|null} Météo France icon code, or null when unknown.
 * @example
 * const icon = convertIcon('01d'); // 'p1j'
 */
function convertIcon(owIcon) {
  const match = owIcon && `${owIcon}`.match(/^(\d{2})([dn])$/);
  if (!match || !OW_ICON_TO_MF[match[1]]) {
    return null;
  }
  return `${OW_ICON_TO_MF[match[1]]}${match[2] === 'd' ? 'j' : 'n'}`;
}

/**
 * @description Convert a wind direction in degrees to a French cardinal label, as Météo France does.
 * @param {number|null} deg - Wind direction in degrees.
 * @returns {string|null} Cardinal label (N, NE, E, ...), or null.
 * @example
 * const cardinal = degreesToCardinal(225); // 'SO'
 */
function degreesToCardinal(deg) {
  if (deg == null || Number.isNaN(Number(deg))) {
    return null;
  }
  return WIND_CARDINALS[Math.round((((Number(deg) % 360) + 360) % 360) / 45) % 8];
}

/**
 * @description Build one Météo France-like hourly entry from an OpenWeather data point.
 * @param {any} point - OpenWeather current weather or forecast list entry.
 * @returns {any} Météo France-like forecast entry.
 * @example
 * const entry = buildForecastEntry(forecast.list[0]);
 */
function buildForecastEntry(point) {
  const weather = (point.weather && point.weather[0]) || {};
  // No rain amounts on purpose: the OpenWeather 3h accumulations are partial and
  // unreliable over a day, so only the rain probability (pop) is exposed
  return {
    dt: point.dt,
    T: { value: point.main && point.main.temp != null ? point.main.temp : null },
    humidity: point.main && point.main.humidity != null ? point.main.humidity : null,
    sea_level: point.main && point.main.pressure != null ? point.main.pressure : null,
    wind: {
      // OpenWeather metric wind speed is in m/s, same unit as Météo France
      speed: point.wind && point.wind.speed != null ? point.wind.speed : null,
      icon: degreesToCardinal(point.wind ? point.wind.deg : null),
    },
    weather: {
      icon: convertIcon(weather.icon),
      desc: weather.description || '',
    },
  };
}

/**
 * @description Convert OpenWeather current weather + 5 day forecast responses
 * to the raw Météo France forecast format used by the widget and the forecast summary.
 * @param {any} current - OpenWeather /data/2.5/weather response.
 * @param {any} forecast - OpenWeather /data/2.5/forecast response (3h steps, 5 days).
 * @returns {any} Météo France-like forecast object.
 * @example
 * const data = formatOpenWeatherAsMeteoFrance(currentResponse, forecastResponse);
 */
function formatOpenWeatherAsMeteoFrance(current, forecast) {
  const city = (forecast && forecast.city) || {};
  /** @type {Array<any>} */
  const list = (forecast && forecast.list) || [];
  // Timezone shift in seconds, used to group 3h slots by local day
  const timezoneShift = city.timezone != null ? city.timezone : 0;

  /** @type {Array<any>} */
  const hourly = [];
  if (current && current.dt) {
    hourly.push(buildForecastEntry(current));
  }
  list.forEach((point) => {
    hourly.push(buildForecastEntry(point));
  });

  // Rain probability comes from the "pop" field (0 to 1) of each 3h slot
  const probabilityForecast = list
    .filter((point) => point.pop != null)
    .map((point) => ({
      dt: point.dt,
      rain: { '3h': Math.round(point.pop * 100) },
    }));

  // Group the 3h slots by local day to build the daily forecast
  /** @type {Object<string, Array<any>>} */
  const slotsByDay = {};
  /** @type {Array<string>} */
  const dayKeys = [];
  list.forEach((point) => {
    const dayKey = new Date((point.dt + timezoneShift) * 1000).toISOString().slice(0, 10);
    if (!slotsByDay[dayKey]) {
      slotsByDay[dayKey] = [];
      dayKeys.push(dayKey);
    }
    slotsByDay[dayKey].push(point);
  });

  const dailyForecast = dayKeys.map((dayKey, dayIndex) => {
    const slots = slotsByDay[dayKey];
    /** @type {number|null} */
    let min = null;
    /** @type {number|null} */
    let max = null;
    slots.forEach((point) => {
      const temp = point.main && point.main.temp != null ? point.main.temp : null;
      if (temp !== null) {
        min = min === null ? temp : Math.min(min, temp);
        max = max === null ? temp : Math.max(max, temp);
      }
    });
    // Weather of the day: the slot closest to local midday
    const localMidday = Date.UTC(
      Number(dayKey.slice(0, 4)),
      Number(dayKey.slice(5, 7)) - 1,
      Number(dayKey.slice(8, 10)),
      12,
    );
    const middayTs = localMidday / 1000 - timezoneShift;
    const middaySlot = slots.reduce(
      (best, point) => (!best || Math.abs(point.dt - middayTs) < Math.abs(best.dt - middayTs) ? point : best),
      null,
    );
    const middayWeather = (middaySlot && middaySlot.weather && middaySlot.weather[0]) || {};
    return {
      dt: middaySlot ? middaySlot.dt : slots[0].dt,
      T: { min, max },
      weather12H: {
        icon: convertIcon(middayWeather.icon),
        desc: middayWeather.description || '',
      },
      // Daily rain totals are deliberately absent (see buildForecastEntry)
      precipitation: { '24h': null },
      // Sunrise/sunset are only provided for the current day; UV is not available on this API plan
      sun: dayIndex === 0 && city.sunrise ? { rise: city.sunrise, set: city.sunset } : null,
      uv: null,
    };
  });

  return {
    position: {
      name: city.name || (current && current.name) || '',
      // No French department outside the Météo France coverage
      dept: null,
    },
    updated_on: current && current.dt ? current.dt : Math.floor(Date.now() / 1000),
    forecast: hourly,
    probability_forecast: probabilityForecast,
    daily_forecast: dailyForecast,
  };
}

module.exports = {
  formatOpenWeatherAsMeteoFrance,
  convertIcon,
  degreesToCardinal,
};
