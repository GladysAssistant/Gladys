const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { convertFeature } = require('./tuya.convertFeature');
const logger = require('../../../../utils/logger');

/**
 * @description Transform Tuya device to Gladys device.
 * @param {object} tuyaDevice - Tuya device.
 * @returns {object} Glladys device.
 * @example
 * tuya.convertDevice({ ... });
 */
function convertDevice(tuyaDevice) {
  const { name, product_name: model, id, specifications = {} } = tuyaDevice;
  const externalId = `tuya:${id}`;
  const { functions = [], status = [] } = specifications;

  logger.debug(`Tuya convert device"${name}, ${model}"`);
  // Groups functions and status on same code
  const groups = {};
  status.forEach((stat) => {
    const { code } = stat;
    groups[code] = { ...stat, readOnly: true };
  });
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
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
    should_poll: true,
  };
  return device;
}

module.exports = {
  convertDevice,
};
