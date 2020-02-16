

/**
 * @description pair a milight device
 * @example
 * rflink.pair()
 */
function pair() {
    let number = '01';
    if (this.currentMilightGateway.name !== undefined && this.currentMilightGateway.number !==undefined) {
        
        if (this.currentMilightGateway.number < 10) {
            number = `0${this.currentMilightGateway.number}`;
        } else {
            number = `${this.currentMilightGateway.number}`;
        }

        this.usb.write(`10;MiLightv1;${this.currentMilightGateway};${number};34BC;PAIR;`);
    }
}

module.exports = {
    pair,
};