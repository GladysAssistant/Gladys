const get = require('get-value');
const uuid = require('uuid');

const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');
const { mappings, readValues } = require('../../services/alexa/lib/deviceMappings');
const { syncDeviceConverter } = require('../../services/alexa/lib/syncDeviceConverter');

// eslint-disable-next-line jsdoc/require-returns
/**
 * @description Send a current state to google.
 * @param {object} stateManager - The state manager.
 * @param {object} gladysGatewayClient - The gladysGatewayClient.
 * @param {string} deviceFeatureSelector - The selector of the device feature to send.
 * @example
 * sendCurrentState(stateManager, 'light');
 */
async function sendCurrentState(stateManager, gladysGatewayClient, deviceFeatureSelector) {
  logger.debug(`Gladys Gateway: Forwarding state to Alexa: ${deviceFeatureSelector}`);
  try {
    // if the event is a DEVICE.NEW_STATE event
    const gladysFeature = stateManager.get('deviceFeature', deviceFeatureSelector);
    const gladysDevice = stateManager.get('deviceById', gladysFeature.device_id);

    const device = syncDeviceConverter(gladysDevice);

    if (!device) {
      logger.debug(`Gladys Gateway: Not forwarding state, device feature doesnt seems handled.`);
      return;
    }

    const func = get(readValues, `${gladysFeature.category}.${gladysFeature.type}`);
    const mapping = get(mappings, `${gladysFeature.category}.capabilities.${gladysFeature.type}`);

    if (!func || !mapping) {
      logger.debug(`Gladys Gateway: Not forwarding state, device feature doesnt seems handled.`);
      return;
    }

    const now = new Date().toISOString();

    const properties = [
      {
        namespace: mapping.interface,
        name: get(mapping, 'properties.supported.0.name'),
        value: func(gladysFeature.last_value, gladysFeature),
        timeOfSample: now,
        uncertaintyInMilliseconds: 0,
      },
    ];

    const payload = {
      event: {
        header: {
          namespace: 'Alexa',
          name: 'ChangeReport',
          messageId: uuid.v4(),
          payloadVersion: '3',
        },
        endpoint: {
          endpointId: gladysDevice.selector,
        },
        payload: {
          change: {
            cause: {
              type: 'PHYSICAL_INTERACTION',
            },
            properties,
          },
        },
      },
      context: {
        properties,
      },
    };

    await gladysGatewayClient.alexaReportState(payload);
  } catch (e) {
    logger.warn(`Gladys Gateway: Unable to forward alexa reportState`);
    logger.warn(e);
  }
}

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
async function forwardDeviceStateToAlexa(event) {
  if (!this.connected) {
    logger.debug('Gateway: not connected. Prevent forwarding device new state.');
    return null;
  }
  if (!this.alexaConnected) {
    logger.debug('Gateway: Alexa not connected. Prevent forwarding device new state.');
    return null;
  }
  if (event.type === EVENTS.DEVICE.NEW_STATE && event.device_feature) {
    if (this.forwardStateToAlexaTimeouts.has(event.device_feature)) {
      clearTimeout(this.forwardStateToAlexaTimeouts.get(event.device_feature));
    }
    const newTimeout = setTimeout(() => {
      sendCurrentState(this.stateManager, this.gladysGatewayClient, event.device_feature);
    }, this.alexaForwardStateTimeout);
    this.forwardStateToAlexaTimeouts.set(event.device_feature, newTimeout);
  }
  return null;
}

module.exports = {
  forwardDeviceStateToAlexa,
};
