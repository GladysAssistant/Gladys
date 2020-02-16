/**
 * @description unpair a milight device
 * @example
 * rflink.unpair()
 */
function unpair() {
    let number = '01';
    if (this.currentMilightGateway.name !== undefined && this.currentMilightGateway.number !==undefined) {
        
        if (this.currentMilightGateway.number < 10) {
            number = `0${this.currentMilightGateway.number}`;
        } else {
            number = `${this.currentMilightGateway.number}`;
        }

        this.usb.write(`10;MiLightv1;${this.currentMilightGateway};${number};34BC;UNPAIR;`);
    } // else {
    // show a message in setup tab to tell user that gatewa y is undefined
   // }

}



module.exports = {
    unpair,
};