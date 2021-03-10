const logger = require('../../../../utils/logger');
const handlers = require('../handlers');

/**
 * @description Starts AwoX service.
 * @example
 * awox.start();
 */
function start() {
  logger.debug(`AwoX: looking for Bluetooth service...`);
  this.bluetooth = this.gladys.service.getService('bluetooth').device;

  Object.keys(handlers).forEach((awoxType) => {
    this.handlers[awoxType] = new handlers[awoxType](this.gladys, this.bluetooth);
  });
}

module.exports = {
  start,
};
