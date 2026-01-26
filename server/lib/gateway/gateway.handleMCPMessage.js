const { IncomingMessageMock } = require('../../services/mcp/lib/IncomingMessageMock');
const { ServerResponseMock } = require('../../services/mcp/lib/ServerResponseMock');

/**
 * @description Handle a new MCP message from Gateway.
 * @param {object} data - Gateway message.
 * @param {object} data.data - Gateway message body.
 * @param {Function} cb - Callback.
 * @returns {Promise} Resolve when finished.
 * @example
 * handleMCPMessage({
 *  type: 'gladys-open-api',
 *  action: 'mcp-webhook',
 *  data: {
 *    mcp_method: 'POST',
 *    mcp_headers: { 'Content-Type': 'application/json' },
 *    mcp_data: { jsonrpc: '2.0', method: 'post', params: {} },
 * });
 */
async function handleMCPMessage({ data }, cb) {
  const service = this.serviceManager.getService('mcp');

  await service.mcpHandler.proxy(
    new IncomingMessageMock(data.mcp_method, data.mcp_headers, data.mcp_data),
    new ServerResponseMock(cb),
  );
}

module.exports = {
  handleMCPMessage,
};
