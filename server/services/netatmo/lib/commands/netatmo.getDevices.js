const { CONFIGURATION } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Get Device.
 * @example
 * netatmo.getDevices();
 */
async function getDevices() {
  let promise = new Promise((resolve, reject) => {
    this.api.getThermostatsData(function(err, sensors) {
      resolve(sensors)
    });
  });
  let sensors = await promise;
  for (let sensor of sensors) {
    for (let element of sensor.modules) {
      if (element.module_name == "Thermostat") {
        this.newValueThermostat(element)
      } else {
        console.log(element)
      }
    }
  }
}

module.exports = {
    getDevices,
};
