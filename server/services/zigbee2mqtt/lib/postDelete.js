const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Called by Gladys once a Zigbee2mqtt device is deleted. A rename is skipped while
 * another Gladys device still owns the new name (a duplicate left by the old rename behavior, or a
 * device removed from the Zigbee network), and the log tells the user to delete it. Deleting it
 * frees the name, so the last inventory received from Zigbee2mqtt is reconciled again right away:
 * waiting for the next "bridge/devices" message could mean waiting for the next restart, and in
 * the meantime the discover page would offer the renamed device as a new one.
 * @param {object} device - The deleted Gladys device.
 * @returns {Promise} Resolve when renamed devices are synchronized.
 * @example
 * await zigbee2mqttManager.postDelete(device);
 */
async function postDelete(device) {
  if (!this.lastBridgeDevices) {
    return;
  }
  await this.syncRenamedDevices(this.lastBridgeDevices);
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
    payload: this.getDiscoveredDevices(),
  });
}

module.exports = {
  postDelete,
};
