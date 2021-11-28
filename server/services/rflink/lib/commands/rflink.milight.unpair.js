const logger = require('../../../../utils/logger');
/**
 * @description unpair a milight device
 * @param {string} currentMilightGateway - Milight gateway.
 * @param {string} milightZone - Milight zone.
 * @example
 * rflink.unpair()
 */
function unpair(currentMilightGateway, milightZone) {
  const number = milightZone;
  if (this.currentMilightGateway !== undefined) {
    const msg = `10;MiLightv1;${this.currentMilightGateway};0${number};34BC;UNPAIR;`;
    logger.debug(msg);
    this.sendUsb.write(msg, (error) => {
      logger.log(error);
    });
  }
  // @TODO :  show a message in setup tab to tell user that gateway is undefined
}

module.exports = {
  unpair,
};
