const logger = require('../../../../utils/logger');
const {
  EVENTS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
/**
 * @description Connect.
 * @example
 * netatmo.getNewThermostat();
 */
function getNewThermostat() {
  let addDevice = this.addDevice;
  let devices = this.devices;
  let serviceId = this.serviceId
  return new Promise(resolve => {
    const response = this.api.getThermostatsData(function(err, allDevices) {
      for (let device of allDevices) {
        let sid = device._id;
        const newDevice = {
          service_id: serviceId,
          name: `Netatmo Control`,
          selector: `netatmo:${sid}`,
          external_id: `netatmo:${sid}`,
          model: 'netatmo-control',
          should_poll: true,
          features: [
            {
              name: 'Temperature',
              selector: `netatmo:${sid}:temperature`,
              external_id: `netatmo:${sid}:temperature`,
              category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
              type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
              unit: DEVICE_FEATURE_UNITS.CELSIUS,
              read_only: true,
              keep_history: true,
              has_feedback: true,
              min: -20,
              max: 60,
            }
          ]
        }
        devices[sid] = newDevice
      }
      console.log(devices)
      resolve(devices)
    });
  })
}

module.exports = {
    getNewThermostat,
};
