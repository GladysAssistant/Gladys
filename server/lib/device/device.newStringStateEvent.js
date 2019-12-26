const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Receive a new state event and save the new state.
 * @param {Object} event - The event object.
 * @param {Object} event.device - The device concerned.
 * @param {Object} event.device_feature_external_id - The deviceFeature concerned.
 * @param {string} event.state - The new state to save.
 * @example
 * newStateEvent({ device_feature_external_id: 'xx', state: 'base64/image' });
 */
async function newStringStateEvent(event) {
  try {
    const deviceFeature = this.stateManager.get('deviceFeatureByExternalId', event.device_feature_external_id);
    if (deviceFeature === null) {
      throw new NotFoundError('DeviceFeature not found');
    }
    await this.saveStringState(event.device, deviceFeature, event.state);
  } catch (e) {
    logger.error(
      `Unable to save new string state of deviceFeature ${event.device_feature_external_id}, state = ${event.state}`,
    );
    logger.error(e);
  }
}

module.exports = {
  newStringStateEvent,
};
