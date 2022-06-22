const { DEFAULT } = require('./constants');

/**
 * @description Prepares service and starts connection with broker if needed.
 * @example
 * disconnect();
 */
async function disconnect() {
  if (this.zwaveMode === DEFAULT.MODE_ZWAVE2MQTT) {
    this.disconnectZwave2mqtt();
  } else {
    this.disconnectZwaveJS();
  }
}

module.exports = {
  disconnect,
};
