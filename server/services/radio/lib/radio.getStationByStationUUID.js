const RadioBrowser = require('radio-browser');
const { RADIO } = require('./utils/radio.constants');

/**
 * @description Return station details by station uuid.
 * @param {string} stationUUID - Station UUID to search.
 * @returns {string} Station details by station uuid.
 * @example
 * getStationByStationUUID('96128e69-0601-11e8-ae97-52543be04c81');
 */
async function getStationByStationUUID(stationUUID) {
  let result;
  let stationUUIDUsed = stationUUID;
  if (!stationUUIDUsed) {
    stationUUIDUsed = await this.gladys.variable.getValue(RADIO.DEFAULT_STATION, this.serviceId);
  }

  if (stationUUIDUsed) {
    this.radioList = [];
    const filter = {
      by: 'uuid',
      searchterm: stationUUIDUsed,
    };

    const [station] = await RadioBrowser.getStations(filter);
    if (station) {
      result = station;
    }
  }

  return result;
}

module.exports = {
  getStationByStationUUID,
};
