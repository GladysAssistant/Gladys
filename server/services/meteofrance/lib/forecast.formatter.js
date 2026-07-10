const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/**
 * @description Build a human readable forecast summary from raw forecast data.
 * @param {any} data - Raw forecast API response.
 * @param {number} days - Number of days in the summary (1 to 5).
 * @returns {object} Today values and a multi-day summary text.
 * @example
 * const summary = buildForecastSummary(data, 2);
 */
function buildForecastSummary(data, days) {
  const dayCount = Math.max(1, Math.min(days || 1, 5));
  const dailyList = ((data && data.daily_forecast) || []).slice(0, dayCount);
  /** @type {Array<any>} */
  const hourly = (data && data.forecast) || [];

  const daySummaries = dailyList.map((/** @type {any} */ day) => {
    // weather12H can be null on some days: fall back to the hourly forecast closest to midday
    let weather = day.weather12H;
    if (!weather || !weather.desc) {
      const midday = day.dt + 12 * 3600;
      const sameDay = hourly.filter((h) => h.dt >= day.dt && h.dt < day.dt + 24 * 3600 && h.weather);
      const closest = sameDay.reduce(
        (/** @type {any} */ best, /** @type {any} */ h) =>
          !best || Math.abs(h.dt - midday) < Math.abs(best.dt - midday) ? h : best,
        null,
      );
      weather = closest ? closest.weather : null;
    }
    const description = (weather && weather.desc) || '';
    const tempMin = day.T && day.T.min != null ? Math.round(day.T.min) : null;
    const tempMax = day.T && day.T.max != null ? Math.round(day.T.max) : null;
    const rain =
      day.precipitation && day.precipitation['24h'] != null ? Math.round(day.precipitation['24h'] * 10) / 10 : null;

    const date = new Date(day.dt * 1000);
    const dayLabel = `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
    let line = `${dayLabel} : ${description}, ${tempMin !== null ? tempMin : '?'}°/${
      tempMax !== null ? tempMax : '?'
    }°`;
    if (rain !== null && rain > 0) {
      line += `, pluie ${rain} mm`;
    }
    return { description, tempMin, tempMax, rain, line };
  });

  const today = daySummaries[0] || { description: '', tempMin: null, tempMax: null, rain: null };
  const firstDay = dailyList[0] || {};
  return {
    description: today.description,
    temp_min: today.tempMin,
    temp_max: today.tempMax,
    rain: today.rain,
    uv: firstDay.uv != null ? firstDay.uv : null,
    summary: daySummaries.map((/** @type {any} */ day) => day.line).join('\n'),
  };
}

module.exports = {
  buildForecastSummary,
};
