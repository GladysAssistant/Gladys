const logger = require('../../../../utils/logger');
/**
 * @description Xiaomi onMessage callback.
 * @param {Buffer} msg - The message buffer.
 * @param {Object} rsinfo - Rs info.
 * @example
 * xiaomi.onMessage('{"model": "motion"}');
 */
function onMessage(value) {
  logger.debug(`*ONNNN MESSAGE : ${value}`);
}

module.exports = {
  onMessage,
};
