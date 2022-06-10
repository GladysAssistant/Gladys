const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');
const { eventFunctionWrapper } = require('../../../utils/functionsWrapper');


/**
 * @description Listen.
 * @example
 * influxdb.listen();
 */
function listen() {
  logger.debug('listen function');
  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, eventFunctionWrapper(this.write.bind(this)));
}

module.exports = {
  listen,
};
