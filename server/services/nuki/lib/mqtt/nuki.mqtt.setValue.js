/**
 * @description Set value value.
 * @param {object} device - Device.
 * @param {string} topic - Device network address.
 * @param {string} command - Command to send.
 * @param {string} value - Value to send.
 * @example
 * setValue(device, topic, command, value);
 */
function setValue(device, topic, command, value) {
  // Send message to Nuki topics
  this.mqttService.device.publish(`cmnd/${topic}/${command}`, `${value}`);
}

module.exports = {
  setValue,
};
