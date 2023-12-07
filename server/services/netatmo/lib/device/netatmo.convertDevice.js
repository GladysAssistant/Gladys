const {
  buildFeatureTemperature,
  buildFeatureThermSetpointTemperature,
  buildFeatureThermSetpointMode,
  buildFeatureThermSetpointEndTime,
  buildFeatureHeatingPowerRequest,
  buildFeatureThermSetpointStartTime,
  buildFeatureOpenWindow,
} = require('./netatmo.buildFeaturesCommonTemp');
const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE } = require('../utils/netatmo.constants');
const { buildFeatureReachable, buildFeatureBattery } = require('./netatmo.buildFeaturesCommon');
const { buildFeatureRfStrength } = require('./netatmo.buildFeaturesRf');
const { buildFeatureWifiStrength } = require('./netatmo.buildFeaturesWifi');
const {
  buildFeatureBoilerStatus,
  buildFeatureHeatingBoilerValveComfortBoost,
  buildFeatureThermOrientation,
  buildFeatureThermRelayCmd,
  buildFeatureAnticipating,
  buildFeatureLastThermSeen,
} = require('./netatmo.buildFeaturesSpecifTherm');
const { buildFeaturePlugConnectedBoiler } = require('./netatmo.buildFeaturesSpecifPlug');

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
      const thermProgramList = netatmoDevice.therm_program_list || [];
      /* features common */
      features.push(buildFeatureBattery(name, externalId));
      /* features common Netatmo Energy */
      features.push(buildFeatureTemperature(name, externalId, 'temperature'));
      features.push(buildFeatureThermSetpointTemperature(name, externalId));
      features.push(buildFeatureThermSetpointMode(name, externalId));
      features.push(buildFeatureThermSetpointStartTime(name, externalId));
      features.push(buildFeatureThermSetpointEndTime(name, externalId));
      features.push(buildFeatureHeatingPowerRequest(name, externalId));
      features.push(buildFeatureOpenWindow(name, externalId));
      /* features common modules RF */
      features.push(buildFeatureRfStrength(name, externalId));
      /* features specif Thermostats */
      features.push(buildFeatureBoilerStatus(name, externalId));
      features.push(buildFeatureHeatingBoilerValveComfortBoost(name, externalId));
      features.push(buildFeatureThermOrientation(name, externalId));
      features.push(buildFeatureThermRelayCmd(name, externalId));
      features.push(buildFeatureAnticipating(name, externalId));
      features.push(buildFeatureLastThermSeen(name, externalId));
      /* params */
      params = [
        { name: 'ROOM_ID', value: room.id },
        { name: 'PLUG_ID', value: plug.id },
        { name: 'THERM_PROGRAM_LIST', value: JSON.stringify(thermProgramList) },
        { name: 'FIRMWARE_REVISION', value: firmwareRevision },
      ];
      break;
    }
    case SUPPORTED_MODULE_TYPE.PLUG: {
      const modulesBridged = netatmoDevice.modules_bridged || [];
      const plugConnectedBoiler = netatmoDevice.plug_connected_boiler;
      /* features common modules RF */
      features.push(buildFeatureRfStrength(name, externalId));
      /* features common modules WiFi */
      features.push(buildFeatureWifiStrength(name, externalId));
      /* features specif Plugs */
      if (plugConnectedBoiler) {
        features.push(buildFeaturePlugConnectedBoiler(name, externalId));
      }
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
