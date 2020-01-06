const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const {
  BRIDGE_EXTERNAL_ID_BASE,
  BRIDGE_MODEL,
  BRIDGE_IP_ADDRESS,
  BRIDGE_MAC,
  BRIDGE_NAME,
  BRIDGE_TYPE
} = require('../utils/consts');

/**
 * @description Configure the milight bridge.
 * @param {string} Mac - Mac Address of the Mi-Light Bridge.
 * @example
 * configureBridge('F0:FE:6B:A6:03:EB');
 */
async function configureBridge(Mac) {
  const bridge = this.bridgesByMac.get(Mac);
  if (!bridge) {
    throw new NotFoundError(`BRIDGE_NOT_FOUND`);
  }
  logger.info(`Connecting to milight bridge "${Mac}", ip = ${bridge.ip}, name = ${bridge.name}`);
  try {
    const deviceCreated = await this.gladys.device.create({
      name: bridge.name,
      service_id: this.serviceId,
      external_id: `${BRIDGE_EXTERNAL_ID_BASE}:${bridge.name}`,
      selector: `${BRIDGE_EXTERNAL_ID_BASE}:${bridge.name}`,
      model: BRIDGE_MODEL,
      features: [],
      params: [
        {
          name: BRIDGE_IP_ADDRESS,
          value: bridge.ip,
        },
        {
          name: BRIDGE_TYPE,
          value: bridge.type,
        },
        {
          name: BRIDGE_MAC,
          value: Mac,
        },
        {
          name: BRIDGE_NAME,
          value: bridge.name,
        },
      ],
    });
    // if bridge is not already in array, we push it
    const bridgeInArray = this.connectedBridges.find((b) => b.external_id === deviceCreated.external_id);
    if (!bridgeInArray) {
      this.connectedBridges.push(deviceCreated);
      logger.debug('Device created');
    }
    logger.debug(this.connectedBridges);
    return deviceCreated;
  } catch (e) {
    throw e;
  }
}

module.exports = {
  configureBridge,
};
