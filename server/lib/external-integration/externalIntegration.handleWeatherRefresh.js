const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { WEATHER_REFRESH_MIN_INTERVAL_MS } = require('./constants');

/**
 * @description Handle the freshness nudge of a "weather" integration
 * (B.18 point 5, "trigger, not data"): re-run the same gated alert check
 * as the 30-min scheduled poll, and the same gated weather-trigger check
 * as the 15-min one — the data re-enters through the audited pull path,
 * the nudge itself carries nothing. Fire-and-forget: a nudge from a
 * non-weather integration or beyond the rate limit is silently dropped
 * (no error path, the scheduled floors catch up).
 * @param {object} service - The sending integration service.
 * @example
 * externalIntegration.handleWeatherRefresh(service);
 */
function handleWeatherRefresh(service) {
  const isWeather = service.manifest && service.manifest.type === 'weather';
  if (!isWeather) {
    logger.debug(`weather.refresh nudge from non-weather integration ${service.selector}: ignored`);
    return;
  }
  const now = Date.now();
  const lastNudge = this.weatherRefreshTimes.get(service.id);
  if (lastNudge !== undefined && now - lastNudge < WEATHER_REFRESH_MIN_INTERVAL_MS) {
    logger.debug(`weather.refresh nudge from ${service.selector} rate-limited: ignored`);
    return;
  }
  this.weatherRefreshTimes.set(service.id, now);
  this.event.emit(EVENTS.WEATHER.CHECK_ALERTS);
  this.event.emit(EVENTS.WEATHER.CHECK_TRIGGERS);
}

module.exports = {
  handleWeatherRefresh,
};
