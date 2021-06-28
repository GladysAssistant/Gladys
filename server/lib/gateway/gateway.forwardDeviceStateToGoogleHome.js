const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { queryDeviceConverter } = require('../../services/google-actions/lib/utils/googleActions.queryDeviceConverter');

const SEND_STATE_TIMEOUT = 5 * 1000;

/**
 * @description send a current state to google
 * @param {Object} stateManager - The state manager.
 * @param {Object} gladysGatewayClient - The gladysGatewayClient.
 * @param {string} deviceFeatureSelector - The selector of the device feature to send.
 * @example
 * sendCurrentState(stateManager, 'light');
 */
async function sendCurrentState(stateManager, gladysGatewayClient, deviceFeatureSelector) {
  logger.debug(`Gladys Gateway: Forwarding state to GoogleHome: ${deviceFeatureSelector}`);
  // if the event is a DEVICE.NEW_STATE event
  const gladysFeature = stateManager.get('deviceFeature', deviceFeatureSelector);
  const gladysDevice = stateManager.get('deviceById', gladysFeature.device_id);

  const device = queryDeviceConverter(gladysDevice);

  const devices = {
    states: {
      [gladysDevice.selector]: device,
    },
  };

  const payload = {
    devices,
  };

  try {
    await gladysGatewayClient.googleHomeReportState(payload);
  } catch (e) {
    logger.warn(`Gladys Gateway: Unable to forward google home reportState`);
  }
}

/**
 * @description Forward websocket message to Gateway.
 * @param {Object} event - Websocket event.
 * @returns {Promise} - Resolve when finished.
 * @example
 * forwardWebsockets({
 *   type: ''
 *   payload: {}
 * });
 */
async function forwardDeviceStateToGoogleHome(event) {
  if (!this.connected) {
    logger.debug('Gateway: not connected. Prevent forwarding device new state.');
    return null;
  }
  if (!this.googleHomeConnected) {
    logger.debug('Gateway: Google home not connected. Prevent forwarding device new state.');
    return null;
  }
  if (event.type === EVENTS.DEVICE.NEW_STATE && event.device_feature) {
    if (this.forwardStateToGoogleHomeTimeouts.has(event.device_feature)) {
      clearTimeout(this.forwardStateToGoogleHomeTimeouts.get(event.device_feature));
    }
    const newTimeout = setTimeout(() => {
      sendCurrentState(this.stateManager, this.gladysGatewayClient, event.device_feature);
    }, SEND_STATE_TIMEOUT);
    this.forwardStateToGoogleHomeTimeouts.set(event.device_feature, newTimeout);
  }
  return null;
}

module.exports = {
  forwardDeviceStateToGoogleHome,
};
