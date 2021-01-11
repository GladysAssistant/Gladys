const axios = require('axios');
const logger = require('../../../../utils/logger');
/**
 * @description Get thermostat data
 * @example
 * getThermostatsData();
 */
async function getThermostatsData() {
  try {
    const response = await axios.get(`${this.baseUrl}/api/getthermostatsdata?access_token=${this.token}`);
    response.data.body.devices.forEach((sensor) => {
      sensor.modules.forEach((module) => {
        if (module.type === 'NATherm1') {
          // note: "boiler_status": true = Heating request = Boiler ignition
          this.newValueThermostat(module);
        }
      });
    });
  } catch (err) {
    logger.info(`Error on getThermostatData - ${err}`);
  }
}

module.exports = {
  getThermostatsData,
};
