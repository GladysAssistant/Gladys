const { GLADYS_VARIABLES, STATUS } = require('./utils/tuya.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init() {
  const configuration = await this.getConfiguration();
  const manualDisconnect = await this.gladys.variable.getValue(GLADYS_VARIABLES.MANUAL_DISCONNECT, this.serviceId);
  const manualDisconnectEnabled =
    manualDisconnect === true || manualDisconnect === 'true' || manualDisconnect === '1' || manualDisconnect === 1;

  if (manualDisconnectEnabled) {
    this.status = STATUS.NOT_INITIALIZED;
    this.lastError = null;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: this.status, manual_disconnect: true },
    });
    return;
  }

  await this.connect(configuration);
}

module.exports = {
  init,
};
