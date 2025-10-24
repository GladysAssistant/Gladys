const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { proxy: proxyFunction } = require('../lib/mcp.proxy');

module.exports = function MCPController(mcpHandler) {
  /**
   * @api {post} /api/v1/service/mcp/proxy Connect to MCP bridge
   * @apiName proxy
   * @apiGroup MCP
   */
  async function proxy(req, res) {
    return proxyFunction(req, res, mcpHandler);
  }

  return {
    'post /api/v1/service/mcp/proxy': {
      authenticated: true,
      controller: asyncMiddleware(proxy),
    },
  };
};
