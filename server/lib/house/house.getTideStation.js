const logger = require('../../utils/logger');
const { downloadNearestStation } = require('./house.getTideState');

// One variable per house, so two houses on two different coasts each keep
// their own station.
const TIDE_STATION_VARIABLE_PREFIX = 'TIDE_STATION_';

// A station's harmonic constituents describe the shape of the local tide and
// are re-analysed by the hydrographic services every few years. Re-downloading
// them once a month keeps them fresh without ever blocking a prediction.
const STATION_MAX_AGE_DAYS = 30;

/**
 * @public
 * @description Get the tide station of a house, downloading it the first time.
 * The harmonic constituents are stored, so tides are then predicted locally and
 * keep working without network access. A failed refresh keeps the stored
 * station rather than losing the widget.
 * @param {any} house - House with latitude and longitude.
 * @returns {Promise<object>} The station, or null when none could be obtained.
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

  if (stored !== null && !movedAway && !outdated) {
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
    return stored !== null ? stored.station : null;
  }
}

module.exports = {
  getTideStation,
  TIDE_STATION_VARIABLE_PREFIX,
  STATION_MAX_AGE_DAYS,
};
