const axios = require('axios');
const logger = require('../../../../utils/logger');

/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @description Get station data
 * @param {string} mode - Data received
 * @example
 * getStationsData();
 */
async function getStationsData(mode = '') {
  // we get the thermostats
  try {
    const response = await axios.post(`${this.baseUrl}/api/getstationsdata`, { access_token: this.token });
    if (response.data.body.devices !== undefined) {
      response.data.body.devices.forEach((station) => {
        const sid = station._id;
        if (this.devices[sid] === undefined || mode === 'refresh') {
          this.newValueStation(station);
        }
        this.devices[sid] = station;
      });
    } else {
      logger.info(`Files getStationsData - No data devices`);
    }
  } catch (err) {
    logger.info(`Error on getStationsData (station) - ${err}`);
  }
}

module.exports = {
  getStationsData,
};
