const { CONFIGURATION } = require('../constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Get Device.
 * @example
 * netatmo.getDevice();
 */
async function getDevice() {
  let promise = new Promise((resolve, reject) => {
    this.api.getThermostatsData(function(err, devices) {
      resolve(devices)
    });
  });
  let devices = await promise;
  for (let device of devices) {
    for (let element of device.modules) {
      if (element.module_name == "Thermostat") {
        this.newValueThermostat(element)
      }
    }
  }
}

module.exports = {
    getDevice,
};
