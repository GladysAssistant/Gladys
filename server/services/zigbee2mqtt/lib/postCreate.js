const EXTERNAL_ID_PREFIX = 'zigbee2mqtt:';
// Access bit of an expose that Zigbee2mqtt can read on the device ("get")
const ACCESS_GET = 4;
// Power sources of a device that sleeps, or may sleep: it would not answer
const SLEEPING_POWER_SOURCES = ['Battery', 'Unknown'];

/**
 * @description Called by Gladys once a Zigbee2mqtt device is created. Until then, Gladys saves no value of the
 * device, and a sensor may not report again for hours: the device would stay without values on the dashboard.
 * The last values received from it are saved at the date Gladys received them (a text feature at the current date),
 * and a device always listening (a router, or a device on mains) is asked to read its current values.
 * @param {object} device - The created Gladys device.
 * @example
 * zigbee2mqttManager.postCreate(device);
 */
function postCreate(device) {
  const deviceName = device.external_id.substring(EXTERNAL_ID_PREFIX.length);
  const discoveredDevice = this.discoveredDevices[deviceName];
  if (!discoveredDevice) {
    return;
  }

  const lastStates = this.lastReceivedStates[discoveredDevice.ieee_address] || {};
  // From now on, the values of the device are saved as they come
  delete this.lastReceivedStates[discoveredDevice.ieee_address];
  Object.keys(lastStates).forEach((property) => {
    const { value, receivedAt } = lastStates[property];
    this.emitDeviceState(device, deviceName, property, value, receivedAt);
  });

  const { type, power_source: powerSource } = discoveredDevice;
  const alwaysListening = type === 'Router' || (!!powerSource && !SLEEPING_POWER_SOURCES.includes(powerSource));
  // Without broker, the device is asked nothing: its values come with its next report
  if (!alwaysListening || !this.mqttClient) {
    return;
  }
  const payload = {};
  device.features.forEach((feature) => {
    const [, , , , property] = feature.external_id.split(':');
    const expose = property && this.findMatchingExpose(deviceName, property);
    // eslint-disable-next-line no-bitwise
    if (expose && (expose.access & ACCESS_GET) !== 0) {
      payload[property] = '';
    }
  });
  if (Object.keys(payload).length > 0) {
    // Zigbee2mqtt publishes the values read on the topic of the device, saved like any other state
    this.publish(`zigbee2mqtt/${deviceName}/get`, JSON.stringify(payload));
  }
}

module.exports = {
  postCreate,
};
