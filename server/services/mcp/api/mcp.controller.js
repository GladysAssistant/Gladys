const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function MCPController(mcpHandler) {
  /**
   * @api {post} /api/v1/service/mcp/proxy Connect to MCP bridge
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

    try {
      const transport = new mcpHandler.mcp.StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on('close', () => {
        transport.close();
      });

      await mcpHandler.server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      logger.error('Error handling MCP request:', e);

      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error'
          },
          id: null
        });
      }
    }
  }

  return {
    'post /api/v1/service/mcp/proxy': {
      authenticated: true,
      controller: asyncMiddleware(proxy),
    },
  };
};
