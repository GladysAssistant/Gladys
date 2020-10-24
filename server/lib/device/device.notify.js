const get = require('get-value');

const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

const FUNC_BY_EVENT = {
  [EVENTS.DEVICE.CREATE]: 'onNewDevice',
  [EVENTS.DEVICE.UPDATE]: 'onUpdateDevice',
  [EVENTS.DEVICE.DELETE]: 'onDeleteDevice',
};

/**
 * @description Notify a device is created.
 * @param {Object} device - Created device.
 * @param {string} event - Event to send.
 * @example
 * device.notify({ service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279'}, 'device.create');
 */
function notify(device, event) {
  logger.debug(`Notify device ${device.selector} creation`);

  const serviceFuncName = FUNC_BY_EVENT[event];

  if (!serviceFuncName) {
    logger.warn(`Event ${event} not handled to notify device changes`);
  } else {
    // send global event
    this.eventManager.emit(event, device);

    // notify concerned service
    const service = this.serviceManager.getServiceById(device.service_id);
    if (service === null) {
      logger.warn(`Service ${device.service_id} was not found.`);
    } else if (typeof get(service, `device.${serviceFuncName}`) !== 'function') {
      logger.info(`Function device.${serviceFuncName} in service ${service.name} does not exist.`);
    } else {
      service.device[serviceFuncName](device);
    }
  }
}

module.exports = {
  notify,
};
