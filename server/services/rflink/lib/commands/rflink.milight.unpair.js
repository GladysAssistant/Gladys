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
        logger.log(msg);
        this.sendUsb.write(msg, error => {
            logger.log(error);
        });
    } // else {
    // show a message in setup tab to tell user that gatewa y is undefined
   // }

}



module.exports = {
    unpair,
};