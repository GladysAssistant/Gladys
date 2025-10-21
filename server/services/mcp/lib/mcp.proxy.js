const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { ServerResponseMock } = require('./ServerResponseMock');

/**
 * @description Connect to MCP.
 * @param {*} data - Data from gateway.
 * @param {Function} cb - Callback with response.
 * @returns {Promise} Resolve when finished.
 * @example
 * proxy(req, res);
 */
async function proxy({ data }, cb) {
  const req = {
    method: data.mcp_method,
    headers: data.mcp_headers,
  };

  const res = new ServerResponseMock(cb);

  if (this.server === null) {
    res.end({
      success: false,
      error: 'MCP server is not running',
    });
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  // res.on('close', () => {
  //   transport.close();
  // });
  await this.server.connect(transport);
  await transport.handleRequest(req, res, data.mcp_data);
}

module.exports = {
  proxy,
};
