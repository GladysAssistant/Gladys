const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Control a specific device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The deviceFeature to control.
 * @param {string} category - Category of deviceFeature to control. Ex: 'light'.
 * @param {string} functionName - The name of the function to call.
 * @param {number} newState - The newState to set.
 * @example
 * device.setValue(device, deviceFeature);
 */
async function setValue(device, deviceFeature, category, functionName, newState) {
  const service = this.serviceManager.getService(device.service.name);
  if (service === null) {
    throw new NotFoundError(`Service ${device.service.name} was not found.`);
  }
  if (!service[category]) {
    throw new NotFoundError(`Service ${device.service.name} is not able to control device of category ${category}.`);
  }
  if (typeof service[category][functionName] !== 'function') {
    throw new NotFoundError(`Function ${category}.${functionName} in service ${device.service.name} does not exist.`);
  }
  await service[category][functionName](device, deviceFeature);
  if (!deviceFeature.has_state_feedback) {
    await this.saveState(deviceFeature, newState);
  }
}

module.exports = {
  setValue,
};
