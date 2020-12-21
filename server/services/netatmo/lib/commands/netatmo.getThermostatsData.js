const logger = require('../../../../utils/logger');

/**
 * @description Get thermostat data
 * @example
 * getThermostatsData();
 */
async function getThermostatsData() {
  // we get the thermostats
  new Promise((resolve, reject) => {
    this.api.getThermostatsData((err, sensors) => {
      resolve(sensors);
    });
  })
    .then((sensors) => {
      sensors.forEach((sensor) => {
        sensor.modules.forEach((module) => {
          if (module.type === 'NATherm1') {
            // note: "boiler_status": true = Heating request = Boiler ignition
            this.newValueThermostat(module);
          } else {
            logger.info(module);
          }
        });
      });
    })
    .catch((err) => {
      logger.info(`Error on getThermostatData - ${err}`);
    });
}

module.exports = {
  getThermostatsData,
};
