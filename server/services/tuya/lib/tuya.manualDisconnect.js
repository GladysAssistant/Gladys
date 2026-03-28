const { GLADYS_VARIABLES } = require('./utils/tuya.constants');

/**
 * @description Manually disconnect from Tuya cloud and disable auto-reconnect.
 * @example
 * await manualDisconnect();
 */
async function manualDisconnect() {
  await this.gladys.variable.setValue(GLADYS_VARIABLES.MANUAL_DISCONNECT, 'true', this.serviceId);
  await this.disconnect({ manual: true });
}

module.exports = {
  manualDisconnect,
};
