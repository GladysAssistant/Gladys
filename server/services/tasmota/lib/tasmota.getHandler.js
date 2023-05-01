const { NotFoundError } = require('../../../utils/coreErrors');
/**
 * @description Get handler according to requested protocol.
 * @param {string} protocol - Protocol to get handler.
 * @returns {object} Requested handler.
 * @example
 * getHandler('http');
 */
function getHandler(protocol) {
  if (!protocol) {
    throw new NotFoundError(`Tasmota: "${protocol}" protocol is not managed`);
  }

  const handler = this.protocols[protocol];
  if (!handler) {
    throw new NotFoundError(`Tasmota: "${protocol}" protocol is not managed`);
  }
  return handler;
}

module.exports = {
  getHandler,
};
