/**
 * @description SunSpec poll device function.
 * @example
 * sunspec.poll();
 */
async function poll() {
  this.scanDevices();
}

module.exports = {
  poll,
};
