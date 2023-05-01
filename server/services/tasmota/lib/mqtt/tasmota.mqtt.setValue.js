/**
 * @description Try to discover HTTP device.
 * @param {object} device - Device.
 * @param {string} topic - Device network address.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * status('192.168.1.1', 11);
 */
function setValue(device, topic, command, value) {
  // Send message to Tasmota topics
  this.mqttService.device.publish(`cmnd/${topic}/${command}`, `${value}`);
}

module.exports = {
  setValue,
};
