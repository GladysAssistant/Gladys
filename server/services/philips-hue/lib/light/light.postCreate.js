const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/parseExternalId');
const { BRIDGE_MODEL, LIGHT_EXTERNAL_ID_BASE } = require('../utils/consts');

/**
 * @description Philips Hue device post creation action: sync bridge cache when a light is added.
 * @param {object} device - The created device.
 * @example
 * postCreate(device);
 */
async function postCreate(device) {
  if (device.model === BRIDGE_MODEL) {
    return;
  }
  if (!device.external_id || !device.external_id.startsWith(`${LIGHT_EXTERNAL_ID_BASE}:`)) {
    return;
  }
  const { bridgeSerialNumber } = parseExternalId(device.external_id);
  logger.debug(`Philips Hue: postCreate sync for light ${device.external_id}`);
  await this.syncBridgeBySerialNumber(bridgeSerialNumber);
}

module.exports = {
  postCreate,
};
