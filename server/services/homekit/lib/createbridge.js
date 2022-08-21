const { Bridge } = require('hap-nodejs');

/**
 * @description Create HomeKit bridge.
 * @param {Object} accessories - All accessories linked to the bridge.
 * @returns {Object} HomeKit bridge to expose.
 * @example
 * createBridge(accessories)
 */
function createBridge(accessories) {
  const gladysBridge = new Bridge('Gladys', this.hap.uuid.generate('hap.examples.gladysBridge'));
  gladysBridge.addBridgedAccessories(accessories);

  return gladysBridge;
}

module.exports = {
  createBridge,
};
