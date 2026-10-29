const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { stub, fake } = sinon;
const { createServer } = require('../../../../services/mcp/lib/createServer');

describe('Create server', () => {
  let mcpHandler;
  let resources;
  let tools;

  beforeEach(() => {
    resources = [
      {
        name: 'resource1',
        uri: 'uri://resource1',
        config: { description: 'Resource 1' },
        cb: fake(),
      },
    ];

    tools = [
      {
        intent: 'device.turn-on-off',
        config: { description: 'Turn on/off device' },
        cb: fake(),
      },
    ];

    mcpHandler = {
      serviceId: '7056e3d4-31cc-4d2a-bbdd-128cd49755e6',
      createServer,
      schemas: { resources, tools },
      mcp: {
        McpServer: stub().callsFake(() => ({
          registerResource: fake(),
          registerTool: fake(),
        })),
      },
    };
  });

  it('should create a server exposing the loaded resources and tools', () => {
    const server = mcpHandler.createServer();

    expect(mcpHandler.mcp.McpServer.callCount).to.eq(1);
    expect(mcpHandler.mcp.McpServer.firstCall.args[0]).to.deep.equal({
      name: 'Gladys',
      title: 'Gladys',
      version: '1.0.0',
    });
    expect(mcpHandler.mcp.McpServer.firstCall.args[1]).to.deep.equal({
      capabilities: {
        resources: {},
        tools: {},
      },
    });
    expect(server).to.eq(mcpHandler.mcp.McpServer.firstCall.returnValue);

    expect(server.registerResource.callCount).to.eq(1);
    expect(server.registerResource.firstCall.args).to.deep.equal([
      'resource1',
      'uri://resource1',
      { description: 'Resource 1' },
      resources[0].cb,
    ]);

    expect(server.registerTool.callCount).to.eq(1);
    expect(server.registerTool.firstCall.args).to.deep.equal([
      'device_turn_on_off',
      { description: 'Turn on/off device' },
      tools[0].cb,
    ]);
  });

  it('should create a new server on each call', () => {
    const firstServer = mcpHandler.createServer();
    const secondServer = mcpHandler.createServer();

    expect(mcpHandler.mcp.McpServer.callCount).to.eq(2);
    expect(firstServer).to.not.eq(secondServer);
    expect(secondServer.registerResource.callCount).to.eq(1);
    expect(secondServer.registerTool.callCount).to.eq(1);
  });
});
