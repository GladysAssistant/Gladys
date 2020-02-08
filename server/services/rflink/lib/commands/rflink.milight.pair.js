

/**
 * @description pair a milight device
 * @example
 * rflink.pair()
 */
function pair() {
    this.usb.write('');

}

module.exports = {
    pair,
};