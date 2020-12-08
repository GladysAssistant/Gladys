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
      if (element.type == "NATherm1") {
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
