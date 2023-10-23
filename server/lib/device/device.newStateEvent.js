const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Receive a new state event and save the new state.
 * @param {object} event - The event object.
 * @param {object} event.device_feature_external_id - The deviceFeature concerned.
 * @param {number} [event.state] - The new state to save.
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
    if (event.text) {
      await this.saveStringState(device, deviceFeature, event.text);
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
