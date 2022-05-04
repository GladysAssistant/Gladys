const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { convertFeature } = require('./feature/tuya.convertFeature');

/**
 * @description Transform Tuya device to Gladys device.
 * @param {Object} tuyaDevice - Tuya device.
 * @returns {Object} Glladys device.
 * @example
 * tuya.convertDevice({ ... });
 */
function convertDevice(tuyaDevice) {
  const { name, product_name: model, uuid, specifications = {} } = tuyaDevice;
  const externalId = `tuya:${uuid}`;
  const { functions = [], status = [] } = specifications;

  // Groups functions and status on same code
  const groups = {};
  functions.forEach((func) => {
    const { code } = func;
    groups[code] = { ...func, readOnly: false };
  });
  status.forEach((stat) => {
    const { code } = stat;
    const { [code]: group = {} } = groups[code];
    groups[code] = { ...stat, ...group, readOnly: true };
  });

  const features = Object.values(groups).map((group) => convertFeature(group, externalId));

  return {
    name,
    features: [],
    external_id: externalId,
    selector: externalId,
    model,
    service_id: this.serviceId,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  };
}

module.exports = {
  convertDevice,
};
