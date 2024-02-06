/**
 * @description This will init the Z-Wave JS UI MQTT connection.
 * @example zwaveJSUI.init();
 */
async function init() {
  await this.connect();
}

module.exports = {
  init,
};
