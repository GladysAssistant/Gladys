const get = require('get-value');

const { NotFoundError } = require('../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');

/**
 * @description Control a specific device.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The deviceFeature to control.
 * @param {string|number} value - The new state to set.
 * @param {object} options - Optional configs.
 * @example
 * device.setValue(device, deviceFeature);
 */
async function setValue(device, deviceFeature, value, options = {}) {
  const service = this.serviceManager.getService(device.service.name);
  if (service === null) {
    throw new NotFoundError(`Service ${device.service.name} was not found.`);
  }
  if (typeof get(service, 'device.setValue') !== 'function') {
    throw new NotFoundError(`Function device.setValue in service ${device.service.name} does not exist.`);
  }
  await service.device.setValue(device, deviceFeature, value, options);
  // If device has feedback, the feedback will be sent and saved
  // @ts-ignore
  const valueIsString = typeof value === 'string' || value instanceof String;
  const isTextFeature =
    deviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT && deviceFeature.type === DEVICE_FEATURE_TYPES.TEXT.TEXT;
  const isSelectFeature =
    deviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT &&
    deviceFeature.type === DEVICE_FEATURE_TYPES.TEXT.SELECT;
  if (!deviceFeature.has_feedback) {
    if (isSelectFeature) {
      // A select state is always its string form, even when the selected option value
      // looks numeric: select features have no numeric state (and no state history)
      await this.saveStringState(device, deviceFeature, String(value));
    } else if (valueIsString) {
      // A string is only a state on a text feature; on any other feature it is a
      // one-shot command (a music notification URL for example): nothing to save
      if (isTextFeature) {
        await this.saveStringState(device, deviceFeature, String(value));
      }
    } else {
      await this.saveState(deviceFeature, value);
    }
  }
}

module.exports = {
  setValue,
};
