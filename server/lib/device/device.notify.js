const get = require('get-value');

const logger = require('../../utils/logger');
const { EVENTS } = require('../../utils/constants');

const FUNC_BY_EVENT = {
  [EVENTS.DEVICE.CREATE]: 'postCreate',
  [EVENTS.DEVICE.UPDATE]: 'postUpdate',
  [EVENTS.DEVICE.DELETE]: 'postDelete',
};

/**
 * @description Notify a device is created.
 * @param {object} device - Created device.
 * @param {string} event - Event to send.
 * @example
 * device.notify({ service_id: 'a810b8db-6d04-4697-bed3-c4b72c996279'}, 'device.create');
 */
async function notify(device, event) {
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
      logger.debug(`Function device.${serviceFuncName} in service ${service.name} does not exist.`);
    } else {
      try {
        await service.device[serviceFuncName](device);
      } catch (e) {
        logger.error(`Failed to execute device.${serviceFuncName} function on service ${device.name}:`, e);
      }
    }
  }
}

module.exports = {
  notify,
};
