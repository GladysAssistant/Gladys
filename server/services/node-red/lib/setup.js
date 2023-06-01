const { CONFIGURATION } = require('./constants');

/**
 * @description Setup Zigbee2mqtt USB device.
 * @param {object} usbConfig - Configuration about USB Zigbee dongle.
 * @example
 * await this.setup({ ZIGBEE2MQTT_DRIVER_PATH: '/dev/tty0', ZIGBEE_DONGLE_NAME: 'zzh' });
 */
async function setup(usbConfig) {
  const z2mDriverPath = usbConfig[CONFIGURATION.Z2M_DRIVER_PATH];
  const z2mDongleName = usbConfig[CONFIGURATION.ZIGBEE_DONGLE_NAME];

  await this.gladys.variable.setValue(CONFIGURATION.Z2M_DRIVER_PATH, z2mDriverPath, this.serviceId);
  await this.gladys.variable.setValue(CONFIGURATION.ZIGBEE_DONGLE_NAME, z2mDongleName, this.serviceId);

  // Reload z2m container with new USB configuration
  await this.init();
}

module.exports = {
  setup,
};
