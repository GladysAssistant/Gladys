const logger = require('../../../utils/logger');

/**
 * @description Connect to MCP.
 * @param {object} req - Origin request.
 * @param {object} res - Server response.
 * @param {object} handler - MCP Handler if necessary.
 * @returns {Promise} Resolve when finished.
 * @example
 * proxy(req, res, mcpHandler);
 */
async function proxy(req, res, handler) {
  const mcpHandler = handler || this;
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
      ...(!handler && { enableJsonResponse: true }),
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
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
}

module.exports = {
  proxy,
};
