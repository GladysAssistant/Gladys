const logger = require('../../../../utils/logger');

/**
 * @description Handler Error from event
 * @returns devices
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
  .catch(() => {
    logger.warning('Erreur getThermostatData')
  })
}

module.exports = {
  getThermostatsData,
};
