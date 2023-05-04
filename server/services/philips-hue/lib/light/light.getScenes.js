const Promise = require('bluebird');
const { NotFoundError } = require('../../../../utils/coreErrors');

const { getDeviceParam } = require('../../../../utils/device');

const { BRIDGE_SERIAL_NUMBER } = require('../utils/consts');

/**
 * @description Get philips hue scenes.
 * @returns {Promise<Array>} Resolve with array of scenes.
 * @example
 * getScenes();
 */
async function getScenes() {
  const scenesToReturn = [];
  await Promise.map(this.connnectedBridges, async (device) => {
    const serialNumber = getDeviceParam(device, BRIDGE_SERIAL_NUMBER);
    const hueApi = this.hueApisBySerialNumber.get(serialNumber);
    if (!hueApi) {
      throw new NotFoundError(`HUE_API_NOT_FOUND`);
    }
    const scenes = await hueApi.scenes.getAll();

    scenes.forEach((scene) => {
      scenesToReturn.push({
        id: scene._id, // eslint-disable-line no-underscore-dangle
        name: scene._rawData.name, // eslint-disable-line no-underscore-dangle
        bridge_serial_number: serialNumber,
      });
    });
  });

  return scenesToReturn;
}

module.exports = {
  getScenes,
};
