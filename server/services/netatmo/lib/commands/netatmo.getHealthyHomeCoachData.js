const axios = require('axios');
const logger = require('../../../../utils/logger');
/**
 * @description Get Healthy HomeCoachs.
 * @param {string} mode - Data received.
 * @example
 * getHealthyHomeCoachData();
 */
async function getHealthyHomeCoachData(mode = '') {
  // we get the les homeCoachs
  try {
    const response = await axios.get(`${this.baseUrl}/api/gethomecoachsdata?access_token=${this.token}`);
    if (response.data.body.devices !== undefined) {
      response.data.body.devices.forEach((homecoach) => {
        // eslint-disable-next-line no-underscore-dangle
        const sid = homecoach._id;
        if (this.devices[sid] === undefined || mode === 'refresh') {
          this.newValueHomeCoach(homecoach);
        }
        this.devices[sid] = homecoach;
      });
    } else {
      logger.info(`Files getHealthyHomeCoachData - No data devices`);
    }
  } catch (err) {
    logger.info(`Error on gethomecoachsdata - ${err}`);
  }
}

module.exports = {
  getHealthyHomeCoachData,
};
