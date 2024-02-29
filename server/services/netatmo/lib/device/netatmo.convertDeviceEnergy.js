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
  const { home, name, type: model, room = {}, plug = {} } = netatmoDevice;
  const id = netatmoDevice.id || netatmoDevice._id;
  const homeId = home || netatmoDevice.home_id;
  const nameDevice = name || netatmoDevice.module_name;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert Energy device "${nameDevice}, ${model}"`);
  const features = [];
  let params = [];
  let roomName = 'undefined';
  const isNotBatteryDevice = model === SUPPORTED_MODULE_TYPE.PLUG;
  const isBatteryDevice = model === SUPPORTED_MODULE_TYPE.THERMOSTAT || model === SUPPORTED_MODULE_TYPE.NRV;

  if (isBatteryDevice) {
    features.push(buildFeatureBattery(nameDevice, externalId));
    features.push(buildFeatureRfStrength(nameDevice, externalId));
    /* params */
    const plugId = plug.id || plug._id;
    const plugName = plug.name || plug.module_name || plug.station_name;
    if (plugId) {
      params = [
        { name: PARAMS.PLUG_ID, value: plugId },
        { name: PARAMS.PLUG_NAME, value: plugName },
      ];
    }
  }
  if (isNotBatteryDevice) {
    const modulesBridged = netatmoDevice.modules_bridged || [];
    features.push(buildFeatureWifiStrength(nameDevice, externalId));
    features.push(buildFeatureRfStrength(nameDevice, externalId));
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
      features.push(buildFeatureTemperature(nameDevice, externalId, 'temperature'));
      if (room.id) {
        features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      }
      /* features specific Energy */
      features.push(buildFeatureThermSetpointTemperature(nameDevice, externalId));
      features.push(buildFeatureOpenWindow(nameDevice, externalId));
      features.push(buildFeatureBoilerStatus(nameDevice, externalId));
      break;
    }
    case SUPPORTED_MODULE_TYPE.PLUG: {
      /* features specific Plugs */
      features.push(buildFeaturePlugConnectedBoiler(nameDevice, externalId));
      break;
    }
    case SUPPORTED_MODULE_TYPE.NRV: {
      /* features common Netatmo */
      if (room.id) {
        features.push(buildFeatureTemperature(`room ${roomName}`, externalId, 'therm_measured_temperature'));
      }
      /* features specific Energy */
      features.push(buildFeatureThermSetpointTemperature(nameDevice, externalId));
      features.push(buildFeatureOpenWindow(nameDevice, externalId));
      features.push(buildFeatureHeatingPowerRequest(nameDevice, externalId));
      break;
    }
    default:
      break;
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
  logger.info(`Netatmo Energy device "${nameDevice}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceEnergy,
};
