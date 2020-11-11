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
      switch (philipsHueLight.modelid) {
        case 'LCT007': // hue white & color 2nd generation
        case 'LCT015': // hue white & color 4th generation
        case 'LST002': // hue lightstrip indoor 2nd generation
        case 'LCT024': // Hue play 1
        case 'LCT010': // Hue A19 White & Color w/ Richer Colors
        case 'LCA001': // Hue color lamp
        case 'GL-C-008': // Non-hue LED Strip
        case 'CLA60 TW OSRAM': // CLA60 TW OSRAM
        case 'LLC020': // Hue go
        case 'LCT012': // Hue White and Color Ambiance Candle E12
        case 'LCT003': // Hue White and Color Ambiance Spot GU10
          lightsToReturn.push(getPhilipsHueColorTemperatureLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'LLC001': // LivingColor lamp 2nd generation
        case 'LLC010': // Hue iris
          lightsToReturn.push(getPhilipsHueColorLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'LWO001': // Hue White Filament Bulb G93 E27
        case 'LWA001': // Hue White Bulb E27 (Dimmable light 2700K)
        case 'LWB010': // Hue white bulb with fixed warming light (2700K)
        case 'LWB006': // Hue white lamp
        case 'LWG001': // Hue white spot 1
        case 'LWG004': // Hue white spot
        case 'LWV001': // Hue White Filament Bulb ST64 E27
        case 'TRADFRI bulb E14 W op/ch 400lm': // IKEA white spot
        case 'TRADFRI bulb E27 W opal 1000lm': // IKEA white lamp
          lightsToReturn.push(getPhilipsHueWhiteLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'LTW012': // Hue White Ambiance E12
        case 'LTW010': // Hue White & Ambiance Bulb
        case 'LTW001': // Hue A19 White & Ambiance Bulb
        case 'LTW013': // Hue White Ambiance GU10
        case 'LTG002': // Hue White Ambiance GU10 w/ BT
        case 'LTA001': // Hue White E27 with Bluetooth
          lightsToReturn.push(getPhilipsHueWhiteTemperatureLight(philipsHueLight, serialNumber, this.serviceId));
          break;
        case 'LOM001': // Hue Smart Plug On/Off
        case 'LOM002': // Hue Smart Plug On/Off
        case 'SP 120': // Innr Smart Plug On/Off
        case 'Plug 01': // OSRAM Plug
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
