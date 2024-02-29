const logger = require('../../../../utils/logger');
const { PARAMS } = require('../utils/netatmo.constants');

/**
 * @description Transform Netatmo device not supported to Gladys device.
 * @param {object} netatmoDevice - Netatmo device.
 * @returns {object} Gladys device.
 * @example
 * netatmo.convertDeviceNotSupported({ ... });
 */
function convertDeviceNotSupported(netatmoDevice) {
  const { home, name, type: model, room = {} } = netatmoDevice;
  const id = netatmoDevice.id || netatmoDevice._id;
  const homeId = home || netatmoDevice.home_id;
  const nameDevice = name || netatmoDevice.module_name || netatmoDevice.station_name;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert device not supported "${nameDevice}, ${model}"`);
  /* params common to all devices features */
  const params = [{ name: PARAMS.HOME_ID, value: homeId }];
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
    features: [],
    params: params.filter((param) => param),
    not_handled: true,
  };
  logger.info(`Netatmo device not supported "${nameDevice}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceNotSupported,
};
