const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { setDeviceParam } = require('../../../../utils/device');

const { getExternalId } = require('../utils/externalId');
const { readStates } = require('../features');
const { readParams } = require('../params');

/**
 * @description Action to execute when WebSocket receives a message.
 * @param {object} ws - Current WebSocket client.
 * @param {object} message - WebSocket message.
 * @example
 * this.onWebSocketMessage();
 */
async function onWebSocketMessage(ws, message) {
  logger.debug('eWeLink: WebSocket received a message: %j', message);

  await this.handleResponse(message);

  const { deviceid = '', params = {} } = message;
  const externalId = getExternalId({ deviceid });

  // Load device to update params
  const device = this.gladys.stateManager.get('deviceByExternalId', externalId);
  if (!device) {
    logger.info(`eWeLink: device "${deviceid} not found in Gladys`);
  } else {
    // Update the device feature values
    const states = readStates(externalId, params);
    states.forEach(({ featureExternalId, state }) => {
      // Before sending event, check if feature exists
      const feature = this.gladys.stateManager.get('deviceFeatureByExternalId', featureExternalId);
      if (feature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: featureExternalId,
          state,
        });
      } else {
        logger.debug(`eWeLink: feature ${featureExternalId} not found in Gladys`);
      }
    });

    // Update the device params
    const updatedParams = readParams(params);
    // Update device params
    await Promise.each(updatedParams, async ({ name, value }) => {
      setDeviceParam(device, name, value);
      await this.gladys.device.setParam(device, name, value);
    });
  }
}

module.exports = {
  onWebSocketMessage,
};
