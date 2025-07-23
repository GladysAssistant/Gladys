const mcpstreamableHttpLocal = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MCPController(mcpHandler) {
  /**
   * @api {post} /api/v1/service/mcp/proxy Restart MCP bridge
   * @apiName proxy
   * @apiGroup MCP
   */
  async function proxy(req, res) {
    if (mcpHandler.server === null) {
      res.json({
        success: false,
        error: 'MCP server is not running',
      });
      return;
    }

    const transport = new mcpstreamableHttpLocal.StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    res.on('close', () => {
      transport.close();
    });
    await mcpHandler.server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  }

  return {
    'post /api/v1/service/mcp/proxy': {
      // authenticated: true,
      // admin: true,
      controller: asyncMiddleware(proxy),
    },
  };
};
