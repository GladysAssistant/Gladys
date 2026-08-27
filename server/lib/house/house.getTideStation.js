const logger = require('../../utils/logger');
const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { downloadNearestStation } = require('./house.getTideState');

// One variable per house, so two houses on two different coasts each keep
// their own station.
const TIDE_STATION_VARIABLE_PREFIX = 'TIDE_STATION_';

// A station's harmonic constituents describe the shape of the local tide and
// are re-analysed by the hydrographic services every few years. Re-downloading
// them once a month keeps them fresh without ever blocking a prediction.
const STATION_MAX_AGE_DAYS = 30;

// How long a failed refresh is remembered. The widget polls every minute, so
// without this a database that is down would be called again on every poll,
// each call holding the dashboard for the request timeout.
const STATION_RETRY_AFTER_FAILURE_HOURS = 6;

/**
 * @public
 * @description Get the tide station of a house, downloading it the first time.
 * The harmonic constituents are stored, so tides are then predicted locally and
 * keep working without network access. A failed refresh keeps the stored
 * station rather than losing the widget.
 * @param {any} house - House with latitude and longitude.
 * @returns {Promise<object>} The station, or null when the database has none to give.
 * @throws {ExternalIntegrationUnavailableError} When the station cannot be downloaded and none was stored.
 * @example
 * const station = await gladys.house.getTideStation(house);
 */
async function getTideStation(house) {
  const { latitude, longitude } = house;
  const variableName = `${TIDE_STATION_VARIABLE_PREFIX}${house.selector.toUpperCase().replace(/-/g, '_')}`;

  let stored = null;
  const rawValue = await this.variable.getValue(variableName);
  if (rawValue) {
    try {
      stored = JSON.parse(rawValue);
    } catch (e) {
      logger.warn(`Tide: stored station for house ${house.selector} is not readable, downloading it again`);
    }
  }

  // The house may have been moved since the station was stored: a station
  // chosen for another place would silently show the wrong coast's tide.
  const movedAway = stored !== null && (stored.house_latitude !== latitude || stored.house_longitude !== longitude);

  const maxAgeMs = STATION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const outdated =
    stored !== null && (!stored.downloaded_at || Date.now() - new Date(stored.downloaded_at).getTime() > maxAgeMs);

  // A refresh that just failed is not retried on the next poll: the stored
  // harmonics still predict the tide, so waiting costs nothing, while calling a
  // database that is down every minute would hold the dashboard each time.
  const retryAfterMs = STATION_RETRY_AFTER_FAILURE_HOURS * 60 * 60 * 1000;
  const failedRecently =
    stored !== null && stored.last_failure_at && Date.now() - new Date(stored.last_failure_at).getTime() < retryAfterMs;

  if (stored !== null && !movedAway && (!outdated || failedRecently)) {
    return stored.station;
  }

  try {
    const station = await downloadNearestStation(latitude, longitude);
    if (station === null) {
      return stored !== null ? stored.station : null;
    }
    await this.variable.setValue(
      variableName,
      JSON.stringify({
        station,
        house_latitude: latitude,
        house_longitude: longitude,
        downloaded_at: new Date().toISOString(),
      }),
    );
    return station;
  } catch (e) {
    // Offline, or the database is down: a station downloaded earlier still
    // predicts tides perfectly, so it is kept rather than dropped.
    logger.warn(`Tide: unable to download the tide station of house ${house.selector}: ${e.message}`);
    if (stored !== null) {
      // Remember when it failed, so the next polls read the stored station
      // instead of calling a database that is down every minute.
      await this.variable.setValue(
        variableName,
        JSON.stringify({ ...stored, last_failure_at: new Date().toISOString() }),
      );
      return stored.station;
    }
    // Nothing stored to fall back on. This is not the same as having no station
    // nearby: the sea may well be next door, so it is raised rather than
    // returned as null, which the widget reads as "this house is inland".
    throw new ExternalIntegrationUnavailableError('TIDE_STATION_DOWNLOAD_FAILED');
  }
}

module.exports = {
  getTideStation,
  TIDE_STATION_VARIABLE_PREFIX,
  STATION_MAX_AGE_DAYS,
  STATION_RETRY_AFTER_FAILURE_HOURS,
};
