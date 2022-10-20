const logger = require('../../../utils/logger');

/**
 * @description Update Gatway State.
 * @param {Object} gateways - List of gateways.
 * @example
 * overkiz.updateGatewayState();
 */
function updateGatewayState(gateways) {
  logger.debug('UpdateGatwayState');

  this.gateways = gateways;

  // TODO send event
}

module.exports = {
  updateGatewayState,
};
