const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Call service
 * @param {string} functionName - Name of the function to call.
 * @param {string} deviceSelector - The selector of the device to control.
 * @param {Array} params - Parameters of the function call.
 * @example
 * callService('play', 'sonos-device', [{uri: 'test'}]);
 */
async function callService(functionName, deviceSelector, params) {
  const device = this.stateManager.get('device', deviceSelector);
  const service = this.serviceManager.getService(device.service.name);
  if (service === null) {
    throw new NotFoundError(`Service ${device.service.name} was not found.`);
  }
  if (!service.music) {
    throw new NotFoundError(`Service ${device.service.name} is not able to control music.`);
  }
  if (typeof service.music[functionName] !== 'function') {
    throw new NotFoundError(`Function music.${functionName} in service ${device.service.name} does not exist.`);
  }
  const res = await service.music[functionName](device, ...params);
  return res;
}

module.exports = {
  callService,
};
