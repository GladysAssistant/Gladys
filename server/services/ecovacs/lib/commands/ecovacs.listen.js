const logger = require('../../../../utils/logger');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

/**
 * @description Listen to all registered vacbots.
 * @example
 * ecovacs.listen();
 */
async function listen() {
  logger.trace(`Listen to vacbots ! They deserve to be heard \o/ `);
  if (!this.connected) {
    await this.connect();
  };
  await this.loadVacbots();
  logger.trace(`Listen to vacbots :`, this.vacbots.size);
  this.vacbots.forEach(async (vacbot) => {
    logger.trace(`Is vacbot ready : ${vacbot.is_ready}`);
    if (!vacbot.is_ready) {
      logger.trace(`Connect vacbot `);
      vacbot.connect();
    }
    vacbot.on('BatteryInfo', eventFunctionWrapper(this.onMessage.bind(this, 'BatteryInfo')));     
  });
}

module.exports = {
  listen,
};
