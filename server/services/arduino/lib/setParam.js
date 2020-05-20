const logger = require('../../../utils/logger');

/**
 * @description Set a param
 * @param {Object} device - The device.
 * @param {Object} data - The data tl set.
 * @example
 * setParam(device, data);
 */
async function setParam(device, data) {
  try {
    const done = await this.gladys.device.setParam({ id: device.id }, 'CODE', data.toString('utf8'));
  } catch (e) {
    logger.warn('Unable to update param');
    logger.debug(e);
  }
}

module.exports = {
  setParam,
};
