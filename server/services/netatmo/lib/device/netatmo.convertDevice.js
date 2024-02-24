const { buildFeatureTemperature, buildFeatureOpenWindow } = require('./netatmo.buildFeaturesCommonTemp');
const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, PARAMS } = require('../utils/netatmo.constants');
const { buildFeatureBattery } = require('./netatmo.buildFeaturesCommon');
const { buildFeatureRfStrength, buildFeatureWifiStrength } = require('./netatmo.buildFeaturesSignal');
const {
  buildFeatureThermSetpointTemperature,
  buildFeatureBoilerStatus,
  buildFeatureHeatingPowerRequest,
  buildFeaturePlugConnectedBoiler,
} = require('./netatmo.buildFeaturesSpecifEnergy');

/**
 * @description Transform Netatmo device to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDevice({ ... });
 */
function convertDevice(netatmoDevice) {
  const { home: homeId, name, type: model, id, room = {}, plug = {} } = netatmoDevice;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert device "${name}, ${model}"`);
  const features = [];
  let params = [];
  switch (model) {
    case SUPPORTED_MODULE_TYPE.THERMOSTAT: {
      /* features common */
      features.push(buildFeatureBattery(name, externalId));
      /* features common Netatmo */
      features.push(buildFeatureTemperature(name, externalId, 'temperature'));
      features.push(buildFeatureTemperature(`room ${room.name}`, externalId, 'therm_measured_temperature'));
      /* features common modules RF */
      features.push(buildFeatureRfStrength(name, externalId));
      /* features specific Energy */
      features.push(buildFeatureThermSetpointTemperature(name, externalId));
      features.push(buildFeatureOpenWindow(name, externalId));
      features.push(buildFeatureBoilerStatus(name, externalId));
      /* params */
      params = [
        { name: PARAMS.PLUG_ID, value: plug.id },
        { name: PARAMS.PLUG_NAME, value: plug.name },
      ];
      break;
    }
    case SUPPORTED_MODULE_TYPE.PLUG: {
      const modulesBridged = netatmoDevice.modules_bridged || [];
      /* features common modules RF */
      features.push(buildFeatureRfStrength(name, externalId));
      /* features common modules WiFi */
      features.push(buildFeatureWifiStrength(name, externalId));
      /* features specif Plugs */
      features.push(buildFeaturePlugConnectedBoiler(name, externalId));
      /* params */
      params = [{ name: PARAMS.MODULES_BRIDGE_ID, value: JSON.stringify(modulesBridged) }];
      break;
    }
    case SUPPORTED_MODULE_TYPE.NRV: {
      /* features common */
      features.push(buildFeatureBattery(name, externalId));
      /* features common Netatmo */
      features.push(buildFeatureTemperature(`room ${room.name}`, externalId, 'therm_measured_temperature'));
      /* features common modules RF */
      features.push(buildFeatureRfStrength(name, externalId));
      /* features specific Energy */
      features.push(buildFeatureThermSetpointTemperature(name, externalId));
      features.push(buildFeatureOpenWindow(name, externalId));
      features.push(buildFeatureHeatingPowerRequest(name, externalId));
      /* params */
      params = [
        { name: PARAMS.PLUG_ID, value: plug.id },
        { name: PARAMS.PLUG_NAME, value: plug.name },
      ];
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
    name,
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
  logger.info(`Netatmo "${name}, ${model}" device converted`);
  return device;
}

module.exports = {
  convertDevice,
};
