const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Receive a new state event and save the new state.
 * @param {Object} event - The event object.
 * @param {Object} event.device_feature_external_id - The deviceFeature concerned.
 * @param {number} event.state - The new state to save.
 * @example
 * newStateEvent({ device_feature_external_id: 'xx', state: 12 });
 */
async function newStateEvent(event) {
  try {
    const deviceFeature = this.stateManager.get('deviceFeatureByExternalId', event.device_feature_external_id);
    if (deviceFeature === null) {
      throw new NotFoundError('DeviceFeature not found');
    }
    await this.saveState(deviceFeature, event.state);
  } catch (e) {
    logger.error(
      `Unable to save new state of deviceFeature ${event.device_feature_external_id}, state = ${event.state}`,
    );
    logger.error(e);
  }
}

module.exports = {
  newStateEvent,
};
