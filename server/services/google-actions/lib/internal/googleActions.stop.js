const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { VARIABLES } = require('../../utils/constants');

/**
 * @description Stop GoogleActions service.
 * @example
 * await googleActionsHandler.stop();
 */
async function stop() {
  logger.info('GoogleActions is stopping...');
  await this.gladys.oauth.updateClientStatus(VARIABLES.GOOGLEACTIONS_OAUTH_CLIENT_ID, false);
  this.smarthome = null;
  this.gladys.event.removeListener(EVENTS.TRIGGERS.CHECK, this.reportState);
  this.gladys.event.removeListener(EVENTS.DEVICE.CREATE, this.requestSync);
  this.gladys.event.removeListener(EVENTS.DEVICE.DELETE, this.requestSync);
  this.gladys.event.removeListener(EVENTS.DEVICE.UPDATE, this.requestSync);
}

module.exports = {
  stop,
};
