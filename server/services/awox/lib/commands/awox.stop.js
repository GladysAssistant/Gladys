/**
 * @description Stops AwoX service.
 * @example
 * awox.stop();
 */
function stop() {
  this.handlers = {};
  this.bluetooth = undefined;
}

module.exports = {
  stop,
};
