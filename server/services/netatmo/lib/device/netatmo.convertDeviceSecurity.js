const logger = require('../../../../utils/logger');
const { PARAMS } = require('../utils/netatmo.constants');
const { buildFeatureWifiStrength } = require('./netatmo.buildFeaturesCommon');
const { buildFeatureMonitoring } = require('./netatmo.buildFeaturesSpecifSecurity');

/**
 * @description Transform Netatmo Security device to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDeviceSecurity({ ... });
 */
function convertDeviceSecurity(netatmoDevice) {
  const { home, name, type: model, room = {} } = netatmoDevice;
  const id = netatmoDevice.id || netatmoDevice._id;
  const homeId = home || netatmoDevice.home_id;
  const nameDevice = name || netatmoDevice.module_name || netatmoDevice.station_name;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert Security device "${nameDevice}, ${model}"`);
  const features = [];
  const modulesBridged = netatmoDevice.modules_bridged || [];

  features.push(buildFeatureWifiStrength(nameDevice, externalId));
  features.push(buildFeatureMonitoring(nameDevice, externalId));

  const params = [
    { name: PARAMS.MODULES_BRIDGE_ID, value: JSON.stringify(modulesBridged) },
    { name: PARAMS.HOME_ID, value: homeId },
  ];
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
  logger.info(`Netatmo Security device "${nameDevice}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceSecurity,
};
