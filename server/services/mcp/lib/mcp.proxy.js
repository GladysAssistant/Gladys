const logger = require('../../../utils/logger');

/**
 * @description Connect to MCP.
 * @param {object} req - Origin request.
 * @param {object} res - Server response.
 * @returns {Promise} Resolve when finished.
 * @example
 * proxy(req, res);
 */
async function proxy(req, res) {
  if (this.server === null) {
    res.json({
      success: false,
      error: 'MCP server is not running',
    });
    return;
  }

  try {
    const transport = new this.mcp.StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close();
    });

    await this.server.connect(transport);
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

module.exports = {
  proxy,
};
