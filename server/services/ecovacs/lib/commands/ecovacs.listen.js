const logger = require('../../../../utils/logger');
const { eventFunctionWrapper } = require('../../../../utils/functionsWrapper');

/**
 * @description Listen to all gladys registered vacbots.
 * @example
 * ecovacs.listen(vacbot, device);
 */
function listen(vacbot, device) {
  if (!vacbot.is_ready) {
    vacbot.connect();
  }
  // bind events
  vacbot.on('BatteryInfo', eventFunctionWrapper(this.onMessage.bind(this, 'BatteryInfo', device)));
  vacbot.on('CleanReport', eventFunctionWrapper(this.onMessage.bind(this, 'CleanReport', device)));
}

module.exports = {
  listen,
};
