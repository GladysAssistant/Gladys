const get = require('get-value');

const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, MUSIC_PLAYBACK_STATE } = require('../../utils/constants');
const { isStringStateFeature, normalizeStringState } = require('../../utils/device');

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
  // BUFFERING is a reported state, never a command (capabilities/music.md, section 1)
  if (
    deviceFeature.category === DEVICE_FEATURE_CATEGORIES.MUSIC &&
    deviceFeature.type === DEVICE_FEATURE_TYPES.MUSIC.PLAYBACK_STATE &&
    Number(value) === MUSIC_PLAYBACK_STATE.BUFFERING
  ) {
    throw new BadParameters(`Playback state ${MUSIC_PLAYBACK_STATE.BUFFERING} (buffering) cannot be written`);
  }
  await service.device.setValue(device, deviceFeature, value, options);
  // If device has feedback, the feedback will be sent and saved
  // @ts-ignore
  const valueIsString = typeof value === 'string' || value instanceof String;
  if (!deviceFeature.has_feedback) {
    if (isStringStateFeature(deviceFeature)) {
      // A text, select or music string feature holds its state as a string: a select state is
      // always its string form, even when the selected option value looks numeric (select
      // features have no numeric state, and no state history)
      const text = normalizeStringState(deviceFeature, value);
      if (text !== null) {
        await this.saveStringState(device, deviceFeature, text);
      }
    } else if (!valueIsString) {
      await this.saveState(deviceFeature, value);
    }
    // A string on any other feature is a one-shot command (a music notification URL for
    // example): nothing to save
  }
}

module.exports = {
  setValue,
};
