const Bottleneck = require('bottleneck');
const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { queryDeviceConverter } = require('../../services/google-actions/lib/utils/googleActions.queryDeviceConverter');

// We want to avoid spamming the Gladys Gateway
// So we limit to 2 concurrent calls + max 5 calls/seconds to Gladys Gateway
// @ts-ignore
const limiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 200,
});

/**
 * @description Send a current state to google.
 * @param {object} stateManager - The state manager.
 * @param {object} gladysGatewayClient - The gladysGatewayClient.
 * @param {string} deviceFeatureSelector - The selector of the device feature to send.
 * @example
 * sendCurrentState(stateManager, 'light');
 */
async function sendCurrentState(stateManager, gladysGatewayClient, deviceFeatureSelector) {
  logger.debug(`Gladys Gateway: Forwarding state to GoogleHome: ${deviceFeatureSelector}`);
  try {
    // if the event is a DEVICE.NEW_STATE event
    const gladysFeature = stateManager.get('deviceFeature', deviceFeatureSelector);
    const gladysDevice = stateManager.get('deviceById', gladysFeature.device_id);

    const device = queryDeviceConverter(gladysDevice);

    // We want to avoid forwarding events that contains only {online: true}
    const properties = Object.keys(device);
    if (properties.length <= 1) {
      logger.debug(`Gladys Gateway: Not forwarding state, device feature doesnt seems handled.`);
      return;
    }

    const devices = {
      states: {
        [gladysDevice.selector]: device,
      },
    };

    const payload = {
      devices,
    };

    await gladysGatewayClient.googleHomeReportState(payload);
  } catch (e) {
    logger.warn(`Gladys Gateway: Unable to forward google home reportState`);
    logger.warn(e);
  }
}

const sendCurrentStateWithRateLimit = limiter.wrap(sendCurrentState);

/**
 * @description Forward websocket message to Gateway.
 * @param {object} event - Websocket event.
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
      sendCurrentStateWithRateLimit(this.stateManager, this.gladysGatewayClient, event.device_feature);
    }, this.googleHomeForwardStateTimeout);
    this.forwardStateToGoogleHomeTimeouts.set(event.device_feature, newTimeout);
  }
  return null;
}

module.exports = {
  forwardDeviceStateToGoogleHome,
};
