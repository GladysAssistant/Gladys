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
  const { home: homeId, name, type: model, id, room = {} } = netatmoDevice;
  const externalId = `netatmo:${id}`;
  logger.debug(`Netatmo convert device not supported "${name}, ${model}"`);

  /* params common to all devices features */
  const params = [{ name: PARAMS.HOME_ID, value: homeId }];
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
    features: [],
    params: params.filter((param) => param),
    not_handled: true,
  };
  logger.info(`Netatmo device not supported "${name}, ${model}" converted`);
  return device;
}

module.exports = {
  convertDeviceNotSupported,
};
