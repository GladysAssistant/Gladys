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
  // The device is kept next to the accessory it produced: a HAP accessory only carries a UUID, and
  // the log below has to be able to name the devices it leaves out.
  const builtDevices = exposedDevices
    .map((device) => {
      try {
        return { device, accessory: this.buildAccessory(device) };
      } catch (e) {
        logger.error(`HomeKit: device ${device.selector} could not be exposed: ${e.message}`);

        return { device, accessory: null };
      }
    })
    .filter(({ accessory }) => accessory !== null);

  // The alarm is not a device: it lives on the house, so one accessory per house is built here
  // rather than from the device list. Several houses give several alarms in the Home app, each
  // named after its own. They go through the same exposure setting as the devices, so someone who
  // does not use the Gladys alarm can leave it out.
  const exposedAlarms = await this.getExposedAlarms();
  const builtAlarms = [];
  exposedAlarms.forEach(({ house }) => {
    try {
      builtAlarms.push({ house, accessory: this.buildAlarmAccessory(house) });
    } catch (e) {
      logger.error(`HomeKit: alarm of house ${house.selector} could not be exposed: ${e.message}`);
    }
  });

  // HomeKit takes 149 accessories on a bridge and HAP throws on the 150th, which would leave a
  // growing instance with no bridge at all rather than with too many accessories. The extra devices
  // are left out instead, and the log says where to choose which ones are kept. Alarms are counted
  // first: there are one or two of them, and a house alarm is not what someone wants dropped.
  const roomForDevices = Math.max(0, MAX_BRIDGED_ACCESSORIES - builtAlarms.length);
  // Sliced once more at the end rather than trusting the reservation above: a house count of its own
  // over the limit is absurd, but a guard whose whole purpose is that the bridge always publishes
  // may not have a case where it throws anyway.
  const bridged = [...builtDevices.slice(0, roomForDevices), ...builtAlarms].slice(0, MAX_BRIDGED_ACCESSORIES);
  const bridgedAccessories = bridged.map(({ accessory }) => accessory);
  const leftOutDevices = builtDevices.slice(roomForDevices);

  if (builtDevices.length + builtAlarms.length > bridgedAccessories.length) {
    // Named, not just counted: `device.get` sorts by name, so the devices left out are the last ones
    // alphabetically and nothing on screen says which tiles went missing.
    const names = leftOutDevices.map(({ device }) => device.selector).join(', ');

    logger.warn(
      `HomeKit: ${builtDevices.length + builtAlarms.length} accessories to expose, HomeKit allows ` +
        `${MAX_BRIDGED_ACCESSORIES} on a bridge. Left out: ${names || 'house alarms'} — choose the ones to ` +
        `expose in the HomeKit settings.`,
    );
  }

  // Indexed after the capacity selection, so an alarm event never resolves an accessory the bridge
  // does not carry.
  this.alarmAccessories = new Map(
    bridged.filter(({ house }) => house !== undefined).map(({ house, accessory }) => [house.selector, accessory]),
  );

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
