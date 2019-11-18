const logger = require('../../../../utils/logger');
const { hslToRgb } = require('../../../../utils/units');
const { getDeviceParam } = require('../../../../utils/device');

const SERVER_PORT = 9898;

/**
 * @description Set value.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The feature to control.
 * @param {Object} state - The new state.
 * @example
 * magicDevices.setValue();
 */
function setValue(device, deviceFeature, state) {
  logger.debug(`MagicDevices.setValue : Setting value of device ${device.external_id}`);
  // this.socket.send(msgStr, 0, msgStr.length, SERVER_PORT, ip, (cb) => {});
}

module.exports = {
  setValue,
};


  // control.turnOff(success => {
  //   logger.debug(success);
  // });

  // control.turnOn(success => {
  //   logger.debug(success);
  // });