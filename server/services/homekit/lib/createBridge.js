const uuid = require('uuid');

/**
 * @description Create HomeKit bridge.
 * @param {Object} accessories - All accessories linked to the bridge.
 * @returns {Promise} HomeKit bridge to expose.
 * @example
 * createBridge(accessories)
 */
async function createBridge(accessories) {
  let bridgeUuid = await this.gladys.variable.getValue('HOMEKIT_GLADYS_UUID', this.serviceId);

  if (!bridgeUuid) {
    bridgeUuid = uuid.v4();
    await this.gladys.variable.setValue('HOMEKIT_GLADYS_UUID', bridgeUuid, this.serviceId);
  }

  const gladysBridge = new this.hap.Bridge('Gladys', bridgeUuid);
  gladysBridge.addBridgedAccessories(accessories);

  return gladysBridge;
}

module.exports = {
  createBridge,
};
