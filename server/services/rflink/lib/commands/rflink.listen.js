/**
 * @description listen
 * @example
 * rflink.listen();
 */
function listen() {
  this.usb.on('data', (data) => {
    this.message(data);
  });
}

module.exports = {
  listen,
};
