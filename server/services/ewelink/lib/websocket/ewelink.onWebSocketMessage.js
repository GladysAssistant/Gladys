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
 * @param {object} message - WebSocket event message.
 * @example
 * await this.onWebSocketMessage();
 */
async function onWebSocketMessage(ws, message) {
  const { data: rawData = '' } = message;
  logger.debug('eWeLink: WebSocket received a message with data: %s', rawData);
  let data = {};
  try {
    data = JSON.parse(rawData);
  } catch (e) {
    logger.debug('eWeLink: WebSocket message is not a JSON object');
  }

  await this.handleResponse(data);

  const { deviceid, params = {} } = data;

  // Message is not concerning a device
  if (!deviceid) {
    logger.debug('eWeLink: WebSocket message is not about a device, skipping it...');
    return;
  }

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
      if (!feature) {
        logger.debug(`eWeLink: feature "${featureExternalId}" not found in Gladys`);
      } else if (feature.last_value === state) {
        // And check if value has really changed
        logger.debug(`eWeLink: feature "${featureExternalId}" state already up-to-date`);
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: featureExternalId,
          state,
        });
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
