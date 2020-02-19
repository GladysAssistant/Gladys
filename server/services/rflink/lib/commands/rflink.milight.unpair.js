/**
 * @description unpair a milight device
 * @param {string} currentMilightGateway - Milight gateway.
 * @example
 * rflink.unpair()
 */
function unpair(currentMilightGateway) {
    let number = '01';
    this.currentMilightGateway.name = currentMilightGateway;
    if (this.currentMilightGateway.name !== undefined && this.currentMilightGateway.number !==undefined) {
        
        if (this.currentMilightGateway.number < 10) {
            number = `0${this.currentMilightGateway.number}`;
        } else {
            number = `${this.currentMilightGateway.number}`;
        }

        const msg = `10;MiLightv1;${this.currentMilightGateway};${number};34BC;UNPAIR;`;
        this.usb.write(msg);
    } // else {
    // show a message in setup tab to tell user that gatewa y is undefined
   // }

}



module.exports = {
    unpair,
};