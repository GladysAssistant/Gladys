/**
 * @description unpair a milight device
 * @example
 * rflink.unpair()
 */
function unpair() {
    this.usb.write('');

}

module.exports = {
    unpair,
};