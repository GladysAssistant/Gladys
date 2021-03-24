const { smarthome } = require('actions-on-google');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');

/**
 * @description Initialize all needs to make GoogleActions service works.
 * @example
 * await googleActionsHandler.init();
 */
async function init() {
  logger.info('GoogleActions is initializing...');
  await this.checkClient();

  // Setting up GA Smart Home
  this.smarthome = smarthome();
  this.smarthome.onSync(this.onSync.bind(this));
  this.smarthome.onQuery(this.onQuery.bind(this));
  this.smarthome.onExecute(this.onExecute.bind(this));

  this.gladys.event.on(EVENTS.TRIGGERS.CHECK, this.reportState);
  this.gladys.event.on(EVENTS.DEVICE.CREATE, this.requestSync);
  this.gladys.event.on(EVENTS.DEVICE.DELETE, this.requestSync);
  this.gladys.event.on(EVENTS.DEVICE.UPDATE, this.requestSync);

  logger.info('GoogleActions initialization done');
}

module.exports = {
  init,
};
