const logger = require('../../../utils/logger');

/**
 * @description Set a param
 * @param {Object} device - The device.
 * @param {Object} data - The data to set.
 * @example
 * setParam(device, data);
 */
async function setParam(gladys, device, data) {
  try {
    const done = await gladys.device.setParam({ id: device.id }, 'CODE', data.toString('utf8'));
  } catch (e) {
    logger.warn('Unable to update param');
    logger.debug(e);
  }
}

module.exports = {
  setParam,
};
