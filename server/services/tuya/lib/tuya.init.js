const { GLADYS_VARIABLES, STATUS } = require('./utils/tuya.constants');
const { buildConfigHash } = require('./utils/tuya.config');
const { normalizeBoolean } = require('./utils/tuya.normalize');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init() {
  const configuration = await this.getConfiguration();
  const { baseUrl, accessKey, secretKey, appAccountId } = configuration || {};

  if (!baseUrl || !accessKey || !secretKey || !appAccountId) {
    this.status = STATUS.NOT_INITIALIZED;
    this.autoReconnectAllowed = false;
    throw new ServiceNotConfiguredError('Tuya is not configured.');
  }

  const lastConnectedHash = await this.gladys.variable.getValue(
    GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH,
    this.serviceId,
  );
  const currentHash = buildConfigHash(configuration);
  const hasMatchingConfig = Boolean(lastConnectedHash && currentHash && lastConnectedHash === currentHash);
  const manualDisconnect = await this.gladys.variable.getValue(GLADYS_VARIABLES.MANUAL_DISCONNECT, this.serviceId);
  const manualDisconnectEnabled = normalizeBoolean(manualDisconnect);

  if (manualDisconnectEnabled) {
    this.autoReconnectAllowed = false;
    this.status = STATUS.NOT_INITIALIZED;
    this.lastError = null;
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: this.status, manual_disconnect: true },
    });
    return;
  }
  this.autoReconnectAllowed = hasMatchingConfig;

  await this.connect(configuration);
}

module.exports = {
  init,
};
