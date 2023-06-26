const uuid = require('uuid');
const { EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');
const { mappings } = require('./deviceMappings');

/**
 * @description Create HomeKit bridge.
 * @returns {Promise} HomeKit bridge to expose.
 * @example
 * createBridge()
 */
async function createBridge() {
  let bridgeUuid = await this.gladys.variable.getValue('HOMEKIT_GLADYS_UUID', this.serviceId);
  let username = await this.gladys.variable.getValue('HOMEKIT_USERNAME', this.serviceId);
  let pincode = await this.gladys.variable.getValue('HOMEKIT_PIN_CODE', this.serviceId);

  if (!bridgeUuid) {
    bridgeUuid = uuid.v4();
    await this.gladys.variable.setValue('HOMEKIT_GLADYS_UUID', bridgeUuid, this.serviceId);
  }

  if (!username) {
    username = await this.newUsername();
  }

  if (!pincode) {
    pincode = await this.newPinCode();
  }

  const devices = await this.gladys.device.get();
  const compatibleDevices = devices.filter((device) => {
    return device.features.find((feature) => {
      return Object.keys(mappings).includes(feature.category);
    });
  });
  const accessories = compatibleDevices
    .map((device) => this.buildAccessory(device))
    .filter((accessory) => accessory !== null);

  if (this.notifyCb) {
    this.gladys.event.removeListener(EVENTS.TRIGGERS.CHECK, this.notifyCb);
  }

  if (this.bridge) {
    await this.bridge.unpublish();
  }

  this.notifyCb = eventFunctionWrapper(this.notifyChange.bind(this, accessories));
  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, this.notifyCb);

  const gladysBridge = new this.hap.Bridge('Gladys', bridgeUuid);
  gladysBridge.addBridgedAccessories(accessories);

  await gladysBridge.publish({
    username,
    pincode,
    port: '47129',
    category: this.hap.Categories.BRIDGE,
  });

  await this.gladys.variable.setValue('HOMEKIT_SETUP_URI', gladysBridge.setupURI(), this.serviceId);

  this.bridge = gladysBridge;
}

module.exports = {
  createBridge,
};
