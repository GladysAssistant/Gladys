const { EVENTS } = require('../../../utils/constants');

/**
 * @description Load the resources and tools exposed over MCP, and reload them when a device is created or updated.
 * @returns {Promise} Resolve when the resources and tools are loaded.
 * @example
 * loadSchemas()
 */
async function loadSchemas() {
  if (!this.schemas) {
    this.gladys.event.on(EVENTS.DEVICE.CREATE, this.reloadCb);
    this.gladys.event.on(EVENTS.DEVICE.UPDATE, this.reloadCb);
  }

  this.schemas = {
    resources: await this.getAllResources(),
    tools: await this.getAllTools(),
  };
}

module.exports = {
  loadSchemas,
};
