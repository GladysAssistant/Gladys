const logger = require('../../../utils/logger');

// eslint-disable-next-line jsdoc/check-alignment
/**
 * @description Convert a rflink device object to a string that can be sent to rflink.
 * @param {object} device - Secure node.
 * @param {string} deviceFeature - The devicce feature.
 * @param {any} state - The state of the device.
 * @returns {string} Rfcode - A code understable for rflink gateway.
 * @example
 * rflink.ObjToRF(device);
 */
function ObjToRF(device, deviceFeature, state) {
  const id = device.external_id.split(':')[1];
  const channel = device.external_id.split(':')[2];

  let Rfcode = `10;${device.model};${id};`;
  logger.debug(`Send to RFLINK : ${Rfcode}`);
  if (channel !== undefined) {
    Rfcode += `${channel};`;
  } else {
    logger.log('channel undefined');
  }

  if (state !== undefined) {
    Rfcode += `${state};`;
  } else {
    logger.log('no state');
  }

  Rfcode += '\n';

  return Rfcode;
}

module.exports = ObjToRF;
