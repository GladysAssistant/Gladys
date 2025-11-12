const { expect } = require('chai');
const { fake, stub } = require('sinon');
const { proxy } = require('../../../../services/mcp/lib/mcp.proxy');

describe('handle mcp connection', () => {
  let mcpHandler;
  let req;
  let res;
  let transport;

  beforeEach(() => {
    transport = {
      close: fake(),
      handleRequest: fake.resolves(undefined),
    };

    req = {
      body: { jsonrpc: '2.0', method: 'post' },
    };

    res = {
      json: fake(),
      status: fake.returns({ json: fake() }),
      on: fake(),
      headersSent: false,
    };
  });

  it('should return error when MCP server is not running', async () => {
    mcpHandler = {
      server: null,
      mcp: {
        StreamableHTTPServerTransport: fake(),
      },
      proxy,
    };

    await mcpHandler.proxy(req, res);

    expect(res.json.callCount).to.eq(1);
    expect(res.json.firstCall.args[0]).to.deep.equal({
      success: false,
      error: 'MCP server is not running',
    });
  });

  it('should successfully handle MCP request', async () => {
    const server = {
      connect: fake.resolves(undefined),
    };

    mcpHandler = {
      server,
      mcp: {
        StreamableHTTPServerTransport: stub().returns(transport),
      },
      proxy,
    };

    await mcpHandler.proxy(req, res);

    expect(mcpHandler.mcp.StreamableHTTPServerTransport.callCount).to.eq(1);
    expect(mcpHandler.mcp.StreamableHTTPServerTransport.firstCall.args[0]).to.deep.equal({
      enableJsonResponse: true,
      sessionIdGenerator: undefined,
    });
    expect(res.on.callCount).to.eq(1);
    expect(res.on.firstCall.args[0]).to.eq('close');
    expect(server.connect.callCount).to.eq(1);
    expect(server.connect.firstCall.args[0]).to.eq(transport);
    expect(transport.handleRequest.callCount).to.eq(1);
    expect(transport.handleRequest.firstCall.args[0]).to.eq(req);
    expect(transport.handleRequest.firstCall.args[1]).to.eq(res);
    expect(transport.handleRequest.firstCall.args[2]).to.deep.equal(req.body);
  });

  it('should close transport when response closes', async () => {
    const server = {
      connect: fake.resolves(undefined),
    };

    mcpHandler = {
      server,
      mcp: {
        StreamableHTTPServerTransport: stub().returns(transport),
      },
      proxy,
    };

    await mcpHandler.proxy(req, res);

    const closeCallback = res.on.firstCall.args[1];
    closeCallback();

    expect(transport.close.callCount).to.eq(1);
  });

  it('should handle error and return 500 when headers not sent', async () => {
    const error = new Error('Test error');
    const server = {
      connect: fake.rejects(error),
    };

    mcpHandler = {
      server,
      mcp: {
        StreamableHTTPServerTransport: stub().returns(transport),
      },
      proxy,
    };

    await mcpHandler.proxy(req, res);

    expect(res.status.callCount).to.eq(1);
    expect(res.status.firstCall.args[0]).to.eq(500);
    expect(res.status().json.callCount).to.eq(1);
    expect(res.status().json.firstCall.args[0]).to.deep.equal({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error',
      },
      id: null,
    });
  });
});
