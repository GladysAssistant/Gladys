const get = require('get-value');

const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Control a specific device.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The deviceFeature to control.
 * @param {string|number} value - The new state to set.
 * @example
 * device.setValue(device, deviceFeature);
 */
async function setValue(device, deviceFeature, value) {
  const service = this.serviceManager.getService(device.service.name);
  if (service === null) {
    throw new NotFoundError(`Service ${device.service.name} was not found.`);
  }
  if (typeof get(service, 'device.setValue') !== 'function') {
    throw new NotFoundError(`Function device.setValue in service ${device.service.name} does not exist.`);
  }
  await service.device.setValue(device, deviceFeature, value);
  // If device has feedback, the feedback will be sent and saved
  // If value is a string, no need to save it
  // @ts-ignore
  const valueIsString = typeof value === 'string' || value instanceof String;
  if (!deviceFeature.has_feedback && !valueIsString) {
    await this.saveState(deviceFeature, value);
  }
}

module.exports = {
  setValue,
};
