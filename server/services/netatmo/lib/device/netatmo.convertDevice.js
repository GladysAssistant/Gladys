const { buildFeatureTemperature, buildFeatureOpenWindow } = require('./netatmo.buildFeaturesCommonTemp');
const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, PARAMS } = require('../utils/netatmo.constants');
const { buildFeatureBattery } = require('./netatmo.buildFeaturesCommon');
const { buildFeatureRfStrength, buildFeatureWifiStrength } = require('./netatmo.buildFeaturesSignal');
const {
  buildFeatureThermSetpointTemperature,
  buildFeatureBoilerStatus,
  buildFeaturePlugConnectedBoiler,
} = require('./netatmo.buildFeaturesSpecifEnergy');
const {
  buildFeatureCo2,
  buildFeatureHumidity,
  buildFeatureNoise,
  buildFeaturePressure,
} = require('./netatmo.buildFeaturesSpecifWeather');

/**
 * @description Transform Netatmo device to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDevice({ ... });
 */
function convertDevice(netatmoDevice) {
  const { home, name, type: model } = netatmoDevice;
  const { room = {}, plug = {}, station_name = undefined, module_name = undefined } = netatmoDevice;
  const id = netatmoDevice.id || netatmoDevice._id;
  const homeId = home || netatmoDevice.home_id;
  const nameDevice = name || module_name || station_name;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert device "${nameDevice}, ${model}"`);
  const features = [];
  let params = [];
  switch (model) {
    case SUPPORTED_MODULE_TYPE.THERMOSTAT: {
      /* features common */
      features.push(buildFeatureBattery(nameDevice, externalId));
      /* features common Netatmo Energy */
      features.push(buildFeatureTemperature(nameDevice, externalId, 'temperature'));
      if (room.id) {
        features.push(buildFeatureTemperature(`room ${room.name}`, externalId, 'therm_measured_temperature'));
      }
      features.push(buildFeatureThermSetpointTemperature(name, externalId));
      features.push(buildFeatureOpenWindow(nameDevice, externalId));
      /* features common modules RF */
      features.push(buildFeatureRfStrength(nameDevice, externalId));
      /* features specific Energy */
      features.push(buildFeatureBoilerStatus(nameDevice, externalId));
      /* params */
      if (plug) {
        params = [
          { name: PARAMS.PLUG_ID, value: plug.id },
          { name: PARAMS.PLUG_NAME, value: plug.name },
        ];
      }
      break;
    }
    case SUPPORTED_MODULE_TYPE.PLUG: {
      const modulesBridged = netatmoDevice.modules_bridged || [];
      /* features common modules RF */
      features.push(buildFeatureRfStrength(nameDevice, externalId));
      /* features common modules WiFi */
      features.push(buildFeatureWifiStrength(nameDevice, externalId));
      /* features specif Plugs */
      features.push(buildFeaturePlugConnectedBoiler(nameDevice, externalId));
      /* params */
      params = [{ name: PARAMS.MODULES_BRIDGE_ID, value: JSON.stringify(modulesBridged) }];
      break;
    }
    case SUPPORTED_MODULE_TYPE.NAMAIN: {
      const modulesBridged = netatmoDevice.modules_bridged || [];
      /* features common Netatmo */
      features.push(buildFeatureTemperature(nameDevice, externalId, 'temperature'));
      if (room.id) {
        features.push(buildFeatureTemperature(`room ${room.name}`, externalId, 'therm_measured_temperature'));
      }
      features.push(buildFeatureTemperature(`Minimum in ${room.name}`, externalId, 'min_temp'));
      features.push(buildFeatureTemperature(`Maximum in ${room.name}`, externalId, 'max_temp'));
      /* features specific Netatmo Weather */
      features.push(buildFeatureCo2(nameDevice, externalId));
      features.push(buildFeatureHumidity(nameDevice, externalId));
      features.push(buildFeatureNoise(nameDevice, externalId));
      features.push(buildFeaturePressure(`Pressure - ${nameDevice}`, externalId, 'pressure'));
      features.push(buildFeaturePressure(`Absolute pressure - ${nameDevice}`, externalId, 'absolute_pressure'));
      /* features common modules WiFi */
      features.push(buildFeatureWifiStrength(nameDevice, externalId));
      /* params */
      params = [{ name: PARAMS.MODULES_BRIDGE_ID, value: JSON.stringify(modulesBridged) }];
      break;
    }
    default:
      break;
  }
  /* params common to all devices features */
  params.push({ name: PARAMS.HOME_ID, value: homeId });
  if (room.id) {
    params.push({ name: PARAMS.ROOM_ID, value: room.id }, { name: PARAMS.ROOM_NAME, value: room.name });
  }
  const device = {
    name: nameDevice,
    external_id: externalId,
    selector: externalId,
    model,
    service_id: this.serviceId,
    should_poll: false,
    features: features.filter((feature) => feature),
    params: params.filter((param) => param),
  };
  if (netatmoDevice.not_handled) {
    device.not_handled = true;
  }
  logger.info(`Netatmo "${nameDevice}, ${model}" device converted`);
  return device;
}

module.exports = {
  convertDevice,
};
