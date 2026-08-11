const uuid = require('uuid');
const { EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');

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
  const configuredMdnsAdvertiser = await this.gladys.variable.getValue('HOMEKIT_MDNS_ADVERTISER', this.serviceId);

  const allowedMdnsAdvertisers = new Set(Object.values(this.hap.MDNSAdvertiser));
  const mdnsAdvertiser = allowedMdnsAdvertisers.has(configuredMdnsAdvertiser)
    ? configuredMdnsAdvertiser
    : this.hap.MDNSAdvertiser.BONJOUR;

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

  const exposedDevices = await this.getExposedDevices();
  const accessories = exposedDevices
    .map((device) => this.buildAccessory(device))
    .filter((accessory) => accessory !== null);

  // The alarm is not a device: it lives on the house, so one accessory per house is built here
  // rather than from the device list. Several houses give several alarms in the Home app, each
  // named after its own.
  const houses = await this.gladys.house.get();
  this.alarmAccessories = new Map();
  houses.forEach((house) => {
    const alarmAccessory = this.buildAlarmAccessory(house);
    this.alarmAccessories.set(house.selector, alarmAccessory);
    accessories.push(alarmAccessory);
  });

  if (this.bridge) {
    await this.stopBridge();
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
    advertiser: mdnsAdvertiser,
  });

  await this.gladys.variable.setValue('HOMEKIT_SETUP_URI', gladysBridge.setupURI(), this.serviceId);

  this.bridge = gladysBridge;
}

module.exports = {
  createBridge,
};
