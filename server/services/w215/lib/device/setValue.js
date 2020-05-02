const W215 = require('../utils/w215');

const logger = require('../../../../utils/logger');
const { getDeviceParam } = require('../../../../utils/device');
const { parseExternalId } = require('../utils/parseExternalId');
const { W215_PIN_CODE } = require('../utils/constants');

/**
 * @description Change value of an SQP-W215 device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  // deviceId is the outlet's IP adress
  const { outletIpAdress } = parseExternalId(device.external_id);

  // To limit errors, we will determine if the device is OK with 4 features expected
  // + Outlet's PIN CODE
  const [pin] = await Promise.all([getDeviceParam(device, W215_PIN_CODE)]);

  const w215Switch = new W215(outletIpAdress, pin);

  w215Switch.setPowerState(value, function(err, result) {
    if (err) {
      logger.debug(`Change state error : ${err}`);
    } else {
      logger.debug(`Change state success : ${result === true ? 'ON' : 'OFF'}`);
    }
  });
}

module.exports = {
  setValue,
};
