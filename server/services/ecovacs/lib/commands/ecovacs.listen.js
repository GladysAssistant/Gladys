const logger = require('../../../../utils/logger');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

/**
 * @description Listen to all registered vacbots.
 * @example
 * ecovacs.listen();
 */
function listen(vacbot, device) {
  logger.trace(`Listen to vacbots ! They deserve to be heard`);
  logger.trace(`Is vacbot ready : ${vacbot.is_ready}`);
  if (!vacbot.is_ready) {
    logger.trace(`Connect vacbot `);
    vacbot.connect();
  }
  vacbot.on('BatteryInfo', eventFunctionWrapper(this.onMessage.bind(this, 'BatteryInfo', device)));
  vacbot.on('CleanReport', eventFunctionWrapper(this.onMessage.bind(this, 'CleanReport', device)));
}

module.exports = {
  listen,
};
