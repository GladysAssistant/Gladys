/**
 * @description Starts the service.
 * @example
 * magicdevices.start();
 */
function start() {
  // const alreadyInGladys = this.gladys.stateManager.get('deviceByExternalId', deviceId);
  // const devices = this.getDevices();
  this.scan();
}



module.exports = {
  start,
};
