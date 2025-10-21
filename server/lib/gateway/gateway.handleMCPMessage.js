/**
 * @description Handle a new MCP message from Gateway.
 * @param {object} data - Gateway message.
 * @param {Function} cb - Callback.
 * @returns {Promise} Resolve when finished.
 * @example
 * handleMCPMessage({
 *  type: 'gladys-open-api',
 *  action: 'mcp-webhook',
 * });
 */
async function handleMCPMessage(data, cb) {
  const service = this.serviceManager.getService('mcp');

  await service.mcpHandler.proxy(data, cb);
}

module.exports = {
  handleMCPMessage,
};
