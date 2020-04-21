'use strict';
//const requireUncached = require('require-uncached');
//const dsp = requireUncached('hnap/js/soapclient');
//var dsp = require('hnap/js/soapclient');

const w215 = require('../utils/w215');

const { STATE } = require('../../../../utils/constants');
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
 * setValue(device, deviceFeature);
 */
async function setValue(device, deviceFeature, value) {

  // deviceId is the outlet's IP adress
  const { outletIpAdress } = parseExternalId(device.external_id);
  this.ip_adress = "http://" + outletIpAdress + "/HNAP1";

  // To limit errors, we will determine if the device is OK with 4 features expected
  // + Outlet's PIN CODE
  const [pin] = await Promise.all([
    getDeviceParam(device, W215_PIN_CODE)
  ]);

  // Variable for debug login issue
  const user = this.username;
  this.pin_code = pin;

  // State asked by gladys
  const state = value === STATE.ON ? 'true' : 'false';

  var w215Switch = new w215(outletIpAdress, pin);

  w215Switch.setPowerState(value, function(err, result) {
    if(err){
      logger.debug(`Change state error : ${err}`);
    } else {
      logger.debug(`Change state success : ${result === STATE.ON ? 'ON' : 'OFF'}`);
    }
  });
}

module.exports = {
  setValue,
};
