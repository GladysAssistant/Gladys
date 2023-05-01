const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Receive a new state event and save the new state.
 * @param {object} event - The event object.
 * @param {object} event.device_feature_external_id - The deviceFeature concerned.
 * @param {number} event.state - The new state to save.
 * @param {string} [event.created_at] - Optional, if you want to save the event in the past.
 * @example
 * newStateEvent({ device_feature_external_id: 'xx', state: 12 });
 */
async function newStateEvent(event) {
  try {
    const deviceFeature = this.stateManager.get('deviceFeatureByExternalId', event.device_feature_external_id);
    if (deviceFeature === null) {
      throw new NotFoundError('DeviceFeature not found');
    }
    if (event.created_at) {
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
