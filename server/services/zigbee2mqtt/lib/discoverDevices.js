/**
 * @description Publish message on discover topic.
 * @example
 * discoverDevices();
 */
function discoverDevices() {
  this.mqttService.client.publish('zigbee2mqtt/bridge/config/devices/get');
}

module.exports = {
  discoverDevices,
};
