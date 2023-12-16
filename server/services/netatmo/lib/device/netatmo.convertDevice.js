const {
  buildFeatureTemperature,
  buildFeatureThermSetpointTemperature,
  buildFeatureThermSetpointMode,
  buildFeatureThermSetpointEndTime,
  buildFeatureThermSetpointStartTime,
  buildFeatureOpenWindow,
} = require('./netatmo.buildFeaturesCommonTemp');
const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE } = require('../utils/netatmo.constants');
const { buildFeatureBattery, buildFeatureLastSeen } = require('./netatmo.buildFeaturesCommon');
const {
  buildFeatureReachable,
  buildFeatureRfStrength,
  buildFeatureWifiStrength,
} = require('./netatmo.buildFeaturesSignal');
const { buildFeatureBoilerStatus, buildFeaturePlugConnectedBoiler } = require('./netatmo.buildFeaturesSpecifEnergy');

/**
 * @description Transform Netatmo device to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDevice({ ... });
 */
function convertDevice(netatmoDevice) {
  const {
    home: homeId,
    name,
    type: model,
    id,
    room = {},
    plug = {},
    firmware_revision: firmwareRevision,
  } = netatmoDevice;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert device "${name}, ${model}"`);
  const features = [];
  let params = [];
  switch (model) {
    case SUPPORTED_MODULE_TYPE.THERMOSTAT: {
      /* features common */
      features.push(buildFeatureBattery(name, externalId));
      features.push(buildFeatureLastSeen(name, externalId, 'last_therm_seen'));
      /* features common Netatmo Energy */
      features.push(buildFeatureTemperature(name, externalId, 'temperature'));
      features.push(buildFeatureTemperature(`room ${room.name}`, externalId, 'therm_measured_temperature'));
      features.push(buildFeatureThermSetpointTemperature(name, externalId));
      features.push(buildFeatureThermSetpointMode(name, externalId));
      features.push(buildFeatureThermSetpointStartTime(name, externalId));
      features.push(buildFeatureThermSetpointEndTime(name, externalId));
      features.push(buildFeatureOpenWindow(name, externalId));
      /* features common modules RF */
      features.push(buildFeatureRfStrength(name, externalId));
      /* features specific Energy */
      features.push(buildFeatureBoilerStatus(name, externalId));
      /* params */
      params = [
        { name: 'ROOM_ID', value: room.id },
        { name: 'PLUG_ID', value: plug.id },
        { name: 'FIRMWARE_REVISION', value: firmwareRevision },
      ];
      break;
    }
    case SUPPORTED_MODULE_TYPE.PLUG: {
      const modulesBridged = netatmoDevice.modules_bridged || [];
      /* features common */
      features.push(buildFeatureLastSeen(name, externalId, 'last_plug_seen'));
      /* features common modules RF */
      features.push(buildFeatureRfStrength(name, externalId));
      /* features common modules WiFi */
      features.push(buildFeatureWifiStrength(name, externalId));
      /* features specif Plugs */
      features.push(buildFeaturePlugConnectedBoiler(name, externalId));
      /* params */
      params = [
        { name: 'ROOM_ID', value: room.id },
        { name: 'MODULES_BRIDGE_ID', value: JSON.stringify(modulesBridged) },
        { name: 'FIRMWARE_REVISION', value: firmwareRevision },
      ];
      break;
    }
    default:
      break;
  }
  /* features common to all devices */
  features.push(buildFeatureReachable(name, externalId));
  params.push({ name: 'HOME_ID', value: homeId });

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

  logger.info(`Netatmo "${name}, ${model}" device converted`);
  return device;
}

module.exports = {
  convertDevice,
};
