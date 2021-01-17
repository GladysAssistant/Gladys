const axios = require('axios');
const logger = require('../../../../utils/logger');
/**
 * @description Get Healthy HomeCoachs.
 * @example
 * getHealthyHomeCoachData();
 */
async function getHealthyHomeCoachData() {
  // we get the les homeCoachs
  try {
    const response = await axios.get(`${this.baseUrl}/api/gethomecoachsdata?access_token=${this.token}`);
    response.data.body.devices.forEach((homecoach) => {
      // eslint-disable-next-line no-underscore-dangle
      const sid = homecoach._id;
      if (this.devices[sid] === undefined) {
        this.newValueHomeCoach(homecoach);
      }
      this.devices[sid] = homecoach;
    });
  } catch (err) {
    logger.info(`Error on gethomecoachsdata - ${err}`);
  }
}

module.exports = {
  getHealthyHomeCoachData,
};
