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
      sensor.modules.forEach((thermostat) => {
        // note: "boiler_status": true = Heating request = Boiler ignition
        if (thermostat.type === 'NATherm1') {
          // eslint-disable-next-line no-underscore-dangle
          const sid = thermostat._id;
          if (this.devices[sid] === undefined) {
            this.newValueThermostat(thermostat);
          }
          this.devices[sid] = thermostat;
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
