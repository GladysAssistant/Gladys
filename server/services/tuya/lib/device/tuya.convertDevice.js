const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { convertFeature } = require('./feature/tuya.convertFeature');

/**
 * @description Transform Tuya device to Gladys device.
 * @param {object} tuyaDevice - Tuya device.
 * @returns {object} Glladys device.
 * @example
 * tuya.convertDevice({ ... });
 */
function convertDevice(tuyaDevice) {
  const { name, product_name: model, uuid, specifications = {} } = tuyaDevice;
  const externalId = `tuya:${uuid}`;
  const { functions = [] } = specifications;

  // Groups functions and status on same code
  const groups = {};
  functions.forEach((func) => {
    const { code } = func;
    groups[code] = { ...func, readOnly: false };
  });

  const features = Object.values(groups).map((group) => convertFeature(group, externalId));

  const device = {
    name,
    features: features.filter((feature) => feature),
    external_id: externalId,
    selector: externalId,
    model,
    service_id: this.serviceId,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
  };
  return device;
}

module.exports = {
  convertDevice,
};
