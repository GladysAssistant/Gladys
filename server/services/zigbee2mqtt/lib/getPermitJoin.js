const logger = require('../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');

/**
 * @description Prepares service and starts connection with broker.
 * @example
 * init();
 */
async function getPermitJoin() {

  return this.z2mPermitJoin;
  
}

module.exports = {
  getPermitJoin,
};
