const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Receive a new string state event and save the new string state.
 * @param {Object} event - The event object.
 * @param {Object} event.device_feature_external_id - The deviceFeature concerned.
 * @param {string} event.state - The new state to save.
 * @example
 * newStateEvent({ device_feature_external_id: 'xx', state: 'string_value' });
 */
async function newStringStateEvent(event) {
  try {
    const deviceFeature = this.stateManager.get('deviceFeatureByExternalId', event.device_feature_external_id);
    if (deviceFeature === null) {
      throw new NotFoundError('DeviceFeature not found');
    }
    const device = this.stateManager.get('deviceById', deviceFeature.device_id);
    await this.saveStringState(device, deviceFeature, event.state);
  } catch (e) {
    logger.debug(e);
  }
}

module.exports = {
  newStringStateEvent,
};
