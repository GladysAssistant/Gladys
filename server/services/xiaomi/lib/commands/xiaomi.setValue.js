const logger = require('../../../../utils/logger');
const { hslToRgb } = require('../../../../utils/units');
const { getDeviceParam } = require('../../../../utils/device');
const { generateGatewayKey } = require('../utils/generateGatewayKey');

const SERVER_PORT = 9898;

/**
 * @description Set value.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The feature to control.
 * @param {object} state - The new state.
 * @example
 * xiaomi.setValue();
 */
function setValue(device, deviceFeature, state) {
  logger.debug(`Xiaomi.setValue : Setting value of device ${device.external_id}`);
  let msg;
  const rgb = hslToRgb(214, 1, 0.5);
  const rgbNumber = 0xff000000 + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]; // eslint-disable-line no-bitwise
  const sid = device.external_id.split(':')[1];
  const ip = this.gatewayIpBySensorSid.get(sid);
  const token = this.gatewayTokenByIp.get(ip);
  const password = getDeviceParam(this.sensors[sid], 'GATEWAY_PASSWORD');
  if (!ip || !token || !password) {
    throw new Error('Missing information to connect to the Gateway');
  }
  const key = generateGatewayKey(token, password);
  switch (device.model) {
    case 'xiaomi-gateway':
      msg = {
        cmd: 'write',
        model: 'gateway',
        sid,
        data: JSON.stringify({
          rgb: rgbNumber,
          key,
        }),
      };
      break;
    case 'xiaomi-duplex-wired-switch':
      msg = {
        cmd: 'write',
        model: this.sensorModelBySensorSid.get(sid),
        sid,
        data: JSON.stringify({
          channel_0: 'off',
          key,
        }),
      };
      break;
    default:
      throw new Error('Device not handled');
  }
  const msgStr = JSON.stringify(msg);
  this.socket.send(msgStr, 0, msgStr.length, SERVER_PORT, ip, (cb) => {});
}

module.exports = {
  setValue,
};
