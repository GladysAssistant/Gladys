const uuid = require('uuid');
const { EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');
const logger = require('../../../utils/logger');

// What HAP accepts on a bridge, `MAX_ACCESSORIES` in its own Accessory.js. Going over it throws, so
// the bound is enforced here rather than discovered at publish time.
const MAX_BRIDGED_ACCESSORIES = 149;

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
  // One accessory that cannot be built must not cost the user every other one: a bridge that fails
  // to publish leaves the whole Home app empty, with nothing on screen saying which device is at
  // fault. The device is dropped and named in the log instead.
  const accessories = exposedDevices
    .map((device) => {
      try {
        return this.buildAccessory(device);
      } catch (e) {
        logger.error(`HomeKit: device ${device.selector} could not be exposed: ${e.message}`);

        return null;
      }
    })
    .filter((accessory) => accessory !== null);

  // The alarm is not a device: it lives on the house, so one accessory per house is built here
  // rather than from the device list. Several houses give several alarms in the Home app, each
  // named after its own. They go through the same exposure setting as the devices, so someone who
  // does not use the Gladys alarm can leave it out.
  const exposedAlarms = await this.getExposedAlarms();
  const alarmAccessories = [];
  this.alarmAccessories = new Map();
  exposedAlarms.forEach(({ house }) => {
    try {
      const alarmAccessory = this.buildAlarmAccessory(house);
      this.alarmAccessories.set(house.selector, alarmAccessory);
      alarmAccessories.push(alarmAccessory);
    } catch (e) {
      logger.error(`HomeKit: alarm of house ${house.selector} could not be exposed: ${e.message}`);
    }
  });

  // HomeKit takes 149 accessories on a bridge and HAP throws on the 150th, which would leave a
  // growing instance with no bridge at all rather than with too many accessories. The extra devices
  // are left out instead, and the log says where to choose which ones are kept. Alarms are counted
  // first: there are one or two of them, and a house alarm is not what someone wants dropped.
  const roomForDevices = Math.max(0, MAX_BRIDGED_ACCESSORIES - alarmAccessories.length);
  // Sliced once more at the end rather than trusting the reservation above: a house count of its own
  // over the limit is absurd, but a guard whose whole purpose is that the bridge always publishes
  // may not have a case where it throws anyway.
  const bridgedAccessories = [...accessories.slice(0, roomForDevices), ...alarmAccessories].slice(
    0,
    MAX_BRIDGED_ACCESSORIES,
  );
  const leftOut = accessories.length + alarmAccessories.length - bridgedAccessories.length;

  if (leftOut > 0) {
    logger.warn(
      `HomeKit: ${accessories.length + alarmAccessories.length} accessories to expose, HomeKit allows ` +
        `${MAX_BRIDGED_ACCESSORIES} on a bridge. ${leftOut} are left out — choose the ones to expose in the ` +
        `HomeKit settings.`,
    );
  }

  if (this.bridge) {
    await this.stopBridge();
  }

  this.notifyCb = eventFunctionWrapper(this.notifyChange.bind(this, bridgedAccessories));
  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, this.notifyCb);

  const gladysBridge = new this.hap.Bridge('Gladys', bridgeUuid);
  gladysBridge.addBridgedAccessories(bridgedAccessories);

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
