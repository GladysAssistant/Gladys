const { BadParameters } = require('../../utils/coreErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Ask an integration to (re)discover its devices (triggered
 * from the Discovery tab of the UI). The integration answers by republishing
 * its discovered devices through POST /discovered_device.
 * @param {string} selector - The selector of the external integration.
 * @returns {Promise} Resolve when the scan request is sent.
 * @example
 * await gladys.externalIntegration.requestScan('ext-dev-my-integration');
 */
async function requestScan(selector) {
  const service = await this.getBySelector(selector);
  const sent = this.sendMessage(service, WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.SCAN_REQUEST, {});
  if (!sent) {
    throw new BadParameters('EXTERNAL_INTEGRATION_NOT_CONNECTED');
  }
}

module.exports = {
  requestScan,
};
