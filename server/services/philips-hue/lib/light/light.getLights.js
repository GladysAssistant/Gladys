const Promise = require('bluebird');
const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const logger = require('../../../../utils/logger');

const { getDeviceParam } = require('../../../../utils/device');
const { getPhilipsHueColorLight } = require('../models/color');
const { getPhilipsHueColorTemperatureLight } = require('../models/colorWithTemperature');
const { getPhilipsHueWhiteLight } = require('../models/white');
const { getPhilipsHueWhiteTemperatureLight } = require('../models/whiteWithTemperature');
const { getPlugOnOff } = require('../models/plugOnOff');

const { LIGHT_EXTERNAL_ID_BASE, BRIDGE_SERIAL_NUMBER } = require('../utils/consts');

/**
 * @description Get lights from all connected bridges.
 * @returns {Promise<Array>} Resolve with array of lights.
 * @example
 * getLights();
 */
async function getLights() {
  const lightsToReturn = [];
  await Promise.map(this.connnectedBridges, async (device) => {
    const serialNumber = getDeviceParam(device, BRIDGE_SERIAL_NUMBER);
    const hueApi = this.hueApisBySerialNumber.get(serialNumber);
    if (!hueApi) {
      throw new NotFoundError(`HUE_API_NOT_FOUND`);
    }
    const lights = await hueApi.lights.getAll();

    lights.forEach((philipsHueLight) => {
      switch (philipsHueLight.type) {
        case 'Extended color light':
          lightsToReturn.push(getPhilipsHueColorTemperatureLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'Color light':
          lightsToReturn.push(getPhilipsHueColorLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'Dimmable light':
          lightsToReturn.push(getPhilipsHueWhiteLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'Color temperature light':
          lightsToReturn.push(getPhilipsHueWhiteTemperatureLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'On/Off plug-in unit':
          lightsToReturn.push(getPlugOnOff(philipsHueLight, serialNumber, this.serviceId));
          break;
        default:
          logger.info(`Philips Hue Light of model ${philipsHueLight.modelid} is not handled yet !`);
          lightsToReturn.push({
            name: philipsHueLight.name,
            service_id: this.serviceId,
            external_id: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}`,
            selector: `${LIGHT_EXTERNAL_ID_BASE}:${serialNumber}:${philipsHueLight.id}`,
            should_poll: true,
            model: philipsHueLight.modelid,
            poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
            features: [],
            not_handled: true,
            raw_philips_hue_device: philipsHueLight,
          });
          break;
      }
    });
  });

  return lightsToReturn;
}

module.exports = {
  getLights,
};
