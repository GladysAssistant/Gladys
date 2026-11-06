const { EVENTS } = require('../../../utils/constants');

/**
 * @description Stop MCP server. The servers created per request are closed with their response.
 * @returns {Promise<void>} Resolves when the server has been stopped.
 * @example
 * stopServer()
 */
async function stopServer() {
  if (this.reloadCb) {
    this.gladys.event.removeListener(EVENTS.DEVICE.CREATE, this.reloadCb);
    this.gladys.event.removeListener(EVENTS.DEVICE.UPDATE, this.reloadCb);
  }

  this.listening = false;
  this.schemas = null;
}

module.exports = {
  stopServer,
};
