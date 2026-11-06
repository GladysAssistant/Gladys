const { expect } = require('chai');

const MCPService = require('../../../services/mcp/index');
const { IncomingMessageMock } = require('../../../services/mcp/lib/IncomingMessageMock');
const { ServerResponseMock } = require('../../../services/mcp/lib/ServerResponseMock');

const sendMcpRequest = (mcpService, body) =>
  new Promise((resolve) => {
    mcpService.mcpHandler.proxy(
      new IncomingMessageMock(
        'POST',
        {
          'content-type': 'application/json',
          accept: 'application/json, text/event-stream',
        },
        body,
      ),
      new ServerResponseMock(resolve),
    );
  });

describe('MCP proxy with the real MCP SDK', () => {
  let mcpService;

  beforeEach(async () => {
    const gladys = {
      room: {
        getAll: async () => [],
      },
      scene: {
        get: async () => [],
      },
      user: {
        get: async () => [],
      },
      house: {
        get: async () => [],
      },
      calendar: {
        get: async () => [],
      },
      area: {
        get: async () => [],
      },
      device: {
        get: async () => [],
        getBySelector: async () => null,
        getDeviceFeaturesAggregates: async () => [],
      },
      event: {
        on: () => {},
        removeListener: () => {},
      },
    };
    mcpService = MCPService(gladys);
    await mcpService.start();
  });

  afterEach(async () => {
    await mcpService.stop();
  });

  it('should answer consecutive requests', async () => {
    const first = await sendMcpRequest(mcpService, { jsonrpc: '2.0', id: 1, method: 'tools/list' });
    const second = await sendMcpRequest(mcpService, { jsonrpc: '2.0', id: 2, method: 'tools/list' });

    expect(first.status).to.eq(200);
    expect(first.body.id).to.eq(1);
    expect(first.body.result.tools)
      .to.be.an('array')
      .with.length.above(0);
    expect(second.status).to.eq(200);
    expect(second.body.id).to.eq(2);
    expect(second.body.result.tools).to.deep.equal(first.body.result.tools);
  });

  it('should answer overlapping requests, each on its own response', async () => {
    const responses = await Promise.all([
      sendMcpRequest(mcpService, { jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      sendMcpRequest(mcpService, { jsonrpc: '2.0', id: 2, method: 'resources/list' }),
      sendMcpRequest(mcpService, { jsonrpc: '2.0', id: 3, method: 'tools/list' }),
    ]);

    expect(responses.map(({ status }) => status)).to.deep.equal([200, 200, 200]);
    expect(responses.map(({ body }) => body.id)).to.deep.equal([1, 2, 3]);
    expect(responses[0].body.result.tools)
      .to.be.an('array')
      .with.length.above(0);
    expect(responses[1].body.result.resources).to.be.an('array');
    expect(responses[2].body.result.tools).to.deep.equal(responses[0].body.result.tools);
  });
});
