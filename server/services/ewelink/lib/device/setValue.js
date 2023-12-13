const { DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const binary = require('../features/binary');
const { parseExternalId } = require('../utils/externalId');

const FEATURE_TYPE_MAP = {
  [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: binary,
};

/**
 * @description Change value of an eWeLink device.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue({ ...device }, { ...deviceFeature }, 1);
 */
async function setValue(device, deviceFeature, value) {
  const { external_id: featureExternalId, type } = deviceFeature;

  const mapper = FEATURE_TYPE_MAP[type];
  if (mapper) {
    const parsedExternalId = parseExternalId(featureExternalId);
    const { deviceId } = parsedExternalId;
    const params = binary.writeParams(device, parsedExternalId, value);

    this.ewelinkWebSocketClient.Connect.updateState(deviceId, params);
  } else {
    logger.warn(`eWeLink: Warning, feature type "${type}" not handled yet!`);
  }
}

module.exports = {
  setValue,
};
