const get = require('get-value');

const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Control a specific device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The deviceFeature to control.
 * @param {string|number} value - The new state to set.
 * @example
 * device.scenario(device, deviceFeature);
 */
async function scenario(device, deviceFeature, value) {
  const service = this.serviceManager.getService(device.service.name);
  if (service === null) {
    throw new NotFoundError(`Service ${device.service.name} was not found.`);
  }
  if (typeof get(service, 'device.scenario') !== 'function') {
    throw new NotFoundError(`Function device.scenario in service ${device.service.name} does not exist.`);
  }
  await service.device.scenario(device, deviceFeature, value);
  if (!deviceFeature.has_feedback) {
    await this.saveState(deviceFeature, value);
  }
}

module.exports = {
  scenario,
};
