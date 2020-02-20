/**
 * @description unpair a milight device
 * @param {string} currentMilightGateway - Milight gateway.
 * @param {string} milightZone - Milight zone.
 * @example
 * rflink.unpair()
 */
function unpair(currentMilightGateway, milightZone) {
    const number = milightZone;
    if (this.currentMilightGateway !== undefined && this.currentMilightGateway.number !==undefined) {
        
        // if (this.currentMilightGateway.number < 10) {
        //     number = `0${this.currentMilightGateway.number}`;
        // } else {
        //     number = `${this.currentMilightGateway.number}`;
        // }

        const msg = `10;MiLightv1;${this.currentMilightGateway};0${number};34BC;UNPAIR;`;
        this.usb.write(msg);
    } // else {
    // show a message in setup tab to tell user that gatewa y is undefined
   // }

}



module.exports = {
    unpair,
};