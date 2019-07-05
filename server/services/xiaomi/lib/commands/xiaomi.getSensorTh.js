const logger = require('../../../../utils/logger');

/**
 * @description Add node
 * @param {boolean} secure - Secure node.
 * @example
 * xiaomi.getSensorTh(true);
 */
function getSensorTh() {
  return this.sensorTh;
}

module.exports = {
  getSensorTh,
};
