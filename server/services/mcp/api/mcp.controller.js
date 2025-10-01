const { randomUUID } = require('node:crypto');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MCPController(mcpHandler) {
  /**
   * @api {post} /api/v1/service/mcp/proxy Start MCP bridge
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

    const sessionId = req.headers['mcp-session-id'];
    let transport;

    if (sessionId && mcpHandler.transports[sessionId]) {
      transport = mcpHandler.transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sId) => {
          mcpHandler.transports[sId] = transport;
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete mcpHandler.transports[transport.sessionId];
        }
      };

      await mcpHandler.server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  }

  /**
   * @api {get|delete} /api/v1/service/mcp/proxy Handle GET and DELETE requests
   * GET requests for server-to-client notifications via SSE
   * DELETE requests for session termination
   * @apiName proxy
   * @apiGroup MCP
   */
  async function handleSessionRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !mcpHandler.transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    await mcpHandler.transports[sessionId].handleRequest(req, res);
  }

  return {
    'post /api/v1/service/mcp/proxy': {
      // authenticated: true,
      // admin: true,
      controller: asyncMiddleware(proxy),
    },
    'get /api/v1/service/mcp/proxy': {
      // authenticated: true,
      // admin: true,
      controller: asyncMiddleware(handleSessionRequest),
    },
    'delete /api/v1/service/mcp/proxy': {
      // authenticated: true,
      // admin: true,
      controller: asyncMiddleware(handleSessionRequest),
    },
  };
};
