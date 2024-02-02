const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, PARAMS } = require('../utils/netatmo.constants');
const {
  buildFeatureBattery,
  buildFeatureRfStrength,
  buildFeatureWifiStrength,
} = require('./netatmo.buildFeaturesCommon');
const { buildFeatureTemperature } = require('./netatmo.buildFeaturesCommonTemp');
const {
  buildFeatureThermSetpointTemperature,
  buildFeatureBoilerStatus,
  buildFeatureHeatingPowerRequest,
  buildFeaturePlugConnectedBoiler,
  buildFeatureOpenWindow,
} = require('./netatmo.buildFeaturesSpecifEnergy');

/**
 * @description Transform Netatmo Energy device to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDeviceEnergy({ ... });
 */
function convertDeviceEnergy(netatmoDevice) {
  const { home: homeId, name, type: model, id, room = {}, plug = {} } = netatmoDevice;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert Energy device "${name}, ${model}"`);
  const features = [];
  let params = [];
  let roomName = 'undefined';
  const isNotBatteryDevice = model === SUPPORTED_MODULE_TYPE.PLUG;
  const isBatteryDevice = model === SUPPORTED_MODULE_TYPE.THERMOSTAT || model === SUPPORTED_MODULE_TYPE.NRV;

  if (isBatteryDevice) {
    features.push(buildFeatureBattery(name, externalId));
    features.push(buildFeatureRfStrength(name, externalId));
    /* params */
    params = [
      { name: PARAMS.PLUG_ID, value: plug.id },
      { name: PARAMS.PLUG_NAME, value: plug.name },
    ];
  }
  if (isNotBatteryDevice) {
    const modulesBridged = netatmoDevice.modules_bridged || [];
    features.push(buildFeatureWifiStrength(name, externalId));
    features.push(buildFeatureRfStrength(name, externalId));
    /* params */
    params = [{ name: PARAMS.MODULES_BRIDGE_ID, value: JSON.stringify(modulesBridged) }];
  }
  /* params common to all devices features */
  params.push({ name: PARAMS.HOME_ID, value: homeId });
  if (room.id) {
    roomName = room.name;
    params.push({ name: PARAMS.ROOM_ID, value: room.id }, { name: PARAMS.ROOM_NAME, value: roomName });
  }
  switch (model) {
    case SUPPORTED_MODULE_TYPE.THERMOSTAT: {
      /* features common Netatmo */
      features.push(buildFeatureTemperature(name, externalId, 'temperature'));
      features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      /* features specific Energy */
      features.push(buildFeatureThermSetpointTemperature(name, externalId));
      features.push(buildFeatureOpenWindow(name, externalId));
      features.push(buildFeatureBoilerStatus(name, externalId));
      break;
    }
    case SUPPORTED_MODULE_TYPE.PLUG: {
      /* features specific Plugs */
      features.push(buildFeaturePlugConnectedBoiler(name, externalId));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NRV: {
      /* features common Netatmo */
      features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      /* features specific Energy */
      features.push(buildFeatureThermSetpointTemperature(name, externalId));
      features.push(buildFeatureOpenWindow(name, externalId));
      features.push(buildFeatureHeatingPowerRequest(name, externalId));
      break;
    }
    default:
      break;
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
  logger.info(`Netatmo Energy device "${name}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceEnergy,
};
