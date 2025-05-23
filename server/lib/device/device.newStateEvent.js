const { NotFoundError } = require('../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../utils/constants');
const logger = require('../../utils/logger');

/**
 * @description Receive a new state event and save the new state.
 * @param {object} event - The event object.
 * @param {object} event.device_feature_external_id - The deviceFeature concerned.
 * @param {number|string} [event.state] - The new state to save.
 * @param {string} [event.created_at] - Optional, if you want to save the event in the past.
 * @param {string} [event.text] - Optional, if you want to save a text.
 * @example
 * newStateEvent({ device_feature_external_id: 'xx', state: 12 });
 */
async function newStateEvent(event) {
  const deviceFeature = this.stateManager.get('deviceFeatureByExternalId', event.device_feature_external_id);
  if (deviceFeature === null) {
    throw new NotFoundError(`DeviceFeature ${event.device_feature_external_id} not found`);
  }
  const device = this.stateManager.get('deviceById', deviceFeature.device_id);
  if (device === null) {
    throw new NotFoundError(`Device ${deviceFeature.device_id} not found`);
  }
  try {
    // If there is a "text" property in the even, we save as string
    if (event.text) {
      await this.saveStringState(device, deviceFeature, event.text);
    } else if (
      deviceFeature.category === DEVICE_FEATURE_CATEGORIES.TEXT &&
      deviceFeature.type === DEVICE_FEATURE_TYPES.TEXT.TEXT
    ) {
      // If the feature is a text, we save as string
      await this.saveStringState(device, deviceFeature, event.state);
    } else if (event.created_at) {
      await this.saveHistoricalState(deviceFeature, event.state, event.created_at);
    } else {
      await this.saveState(deviceFeature, event.state);
    }
  } catch (e) {
    logger.debug(e);
  }
}

module.exports = {
  newStateEvent,
};
