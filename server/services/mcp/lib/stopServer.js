const { EVENTS } = require('../../../utils/constants');

/**
 * @description Stop MCP server.
 * @returns {Promise<void>} Resolves when the server has been stopped.
 * @example
 * stopServer()
 */
async function stopServer() {
  if (this.reloadCb) {
    this.gladys.event.removeListener(EVENTS.DEVICE.CREATE, this.reloadCb);
    this.gladys.event.removeListener(EVENTS.DEVICE.UPDATE, this.reloadCb);
  }

  if (this.server) {
    await this.server.close();
    this.server = null;
  }
}

module.exports = {
  stopServer,
};
