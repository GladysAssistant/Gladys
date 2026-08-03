const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Persist the status of an external integration and push it to
 * the frontend in real time.
 * @param {object} service - The external integration service.
 * @param {string} status - The new status (SERVICE_STATUS value).
 * @returns {Promise<string>} Resolve with the new status.
 * @example
 * await gladys.externalIntegration.saveStatus(service, 'RUNNING');
 */
async function saveStatus(service, status) {
  logger.debug(`External integration ${service.selector}: status ${status}`);
  await db.Service.update({ status }, { where: { id: service.id } });
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.STATUS_CHANGED,
    payload: {
      selector: service.selector,
      status,
    },
  });
  return status;
}

module.exports = {
  saveStatus,
};
