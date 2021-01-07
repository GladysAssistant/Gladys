const axios = require('axios');
const logger = require('../../../../utils/logger');

/**
 * @description Get station data
 * @example
 * getStationsData();
 */
async function getStationsData() {
  // we get the thermostats
  try {
    const response = await axios.post(`${this.baseUrl}/api/getstationsdata`, { access_token: this.token });
    response.data.body.devices.forEach((station) => {
      this.newValueStation(station);
    });
  } catch (err) {
    logger.info(`Error on getStationsData (station) - ${err}`);
  }
}

module.exports = {
  getStationsData,
};
